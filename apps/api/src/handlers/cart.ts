import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import {
  addToCartSchema,
  cartKeys,
  productKeys,
  applyCompetitivePriceReduction,
  cartLineOptionsSignature,
  cartLineUnitTotal,
  productHasCatalogShipping,
  resolveCatalogShippingFee,
  resolveCatalogShippingLabel,
  productAllowsAddons,
  resolveProductAddons,
  isFlashComboProduct,
  isFlashComboSaleActive,
  flashComboUnitPriceUsd,
  productUsesFixedStorefrontPrice,
  CATALOG_VENDOR_UNAVAILABLE_MESSAGE,
  GBO_STOREFRONT_UNAVAILABLE_MESSAGE,
  gboCartLineUnavailableMessage,
  isGboHiddenFromStorefront,
  productAllowedForNewShopping,
  shoppingCountryRejection,
  storefrontShoppingCountryCodes,
  mergeCartItems,
  type Cart,
  type CartItem,
} from "@blossompot/shared";
import { docClient, CARTS_TABLE, PRODUCTS_TABLE, now, ttlInDays } from "../lib/db";
import { ok, badRequest, unauthorized } from "../lib/response";
import { getAuth, getUserOrSessionKey, getSessionId } from "../lib/auth";
import { cartAvailabilityLocation, evaluateProductsForLocation } from "./serviceability";
import { formatPostalDisplay } from "@blossompot/shared";
import { resolveProductImageUrl } from "../lib/images";
import { upsertSessionProfile } from "../lib/customer-profile";
import { loadCatalogCountries } from "../lib/catalog-country-store";
import { decideNewShopping, loadCatalogVendorRegistry, withStoredShoppingIdentity } from "../lib/catalog-vendor-store";
import { getBundledUsarakhiProduct } from "../lib/blossompot-catalog";
import { ensureOrangeCountyProductInDb, getBundledOrangeCountyProduct } from "../lib/orange-county-catalog";
import { ensureProductInDb } from "../lib/ensure-product";

/** Stale carts auto-expire after this many days (TTL). */
const CART_TTL_DAYS = 30;

function ensureLineIds(items: CartItem[]): CartItem[] {
  return items.map((item) =>
    item.lineId ? item : { ...item, lineId: uuidv4() }
  );
}

async function getCart(userKey: string): Promise<Cart & { createdAt?: string }> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CARTS_TABLE,
      Key: { PK: cartKeys.pk(userKey), SK: cartKeys.sk() },
    })
  );
  const raw = (result.Item as Cart & { createdAt?: string }) ?? { items: [], updatedAt: now() };
  return { ...raw, items: ensureLineIds(raw.items ?? []) };
}

/** Single Put — avoids a second Get on every cart write. */
async function saveCart(
  userKey: string,
  cart: Cart & { createdAt?: string },
  sessionId?: string
) {
  const timestamp = now();
  const createdAt = cart.createdAt ?? timestamp;
  const items = ensureLineIds(cart.items ?? []);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const value = items.reduce((sum, i) => sum + cartLineUnitTotal(i) * i.quantity, 0);

  await docClient.send(
    new PutCommand({
      TableName: CARTS_TABLE,
      Item: {
        PK: cartKeys.pk(userKey),
        SK: cartKeys.sk(),
        items,
        userKey,
        sessionId,
        createdAt,
        itemCount,
        value,
        currency: items[0]?.currency,
        updatedAt: timestamp,
        GSI1PK: cartKeys.gsi1pk(),
        GSI1SK: cartKeys.gsi1sk(timestamp),
        expiresAt: ttlInDays(CART_TTL_DAYS),
      },
    })
  );
  cart.items = items;
  cart.updatedAt = timestamp;
}

async function loadCartForRequest(event: APIGatewayProxyEventV2): Promise<{
  userKey: string;
  cart: Cart & { createdAt?: string };
}> {
  const auth = getAuth(event);
  const sessionId = getSessionId(event);
  if (auth && sessionId && auth.userId !== sessionId) {
    const [accountCart, guestCart] = await Promise.all([getCart(auth.userId), getCart(sessionId)]);
    if ((guestCart.items ?? []).length > 0) {
      const items = mergeCartItems(accountCart.items ?? [], guestCart.items ?? []);
      const merged = { ...accountCart, items };
      await saveCart(auth.userId, merged, sessionId);
      await saveCart(sessionId, { items: [], updatedAt: now(), createdAt: guestCart.createdAt }, sessionId);
      return { userKey: auth.userId, cart: merged };
    }
    return { userKey: auth.userId, cart: accountCart };
  }
  const userKey = getUserOrSessionKey(event);
  if (!userKey) throw new Error("UNAUTH");
  return { userKey, cart: await getCart(userKey) };
}

export async function getCartHandler(event: APIGatewayProxyEventV2) {
  let loaded: { userKey: string; cart: Cart & { createdAt?: string } };
  try {
    loaded = await loadCartForRequest(event);
  } catch {
    return unauthorized("Session or auth required");
  }
  const raw = loaded.cart;
  const items = (raw.items ?? []).map((item) => ({
    ...item,
    image: item.image ? resolveProductImageUrl(item.image) : item.image,
  }));
  // Persist backfilled lineIds so subsequent updates work.
  if ((raw.items ?? []).some((i) => !i.lineId)) {
    await saveCart(loaded.userKey, { ...raw, items }, getSessionId(event));
  }
  const country = event.queryStringParameters?.country ?? event.queryStringParameters?.countryCode;
  const postal = event.queryStringParameters?.postalCode ?? event.queryStringParameters?.zip;
  const storedCountries = await loadCatalogCountries();
  const enabledCountryCodes = storefrontShoppingCountryCodes(storedCountries.countries);
  const shoppingLocation = cartAvailabilityLocation(country, postal, enabledCountryCodes);
  if (shoppingLocation && items.length) {
    const [evals, registry] = await Promise.all([
      evaluateProductsForLocation(
        items.map((i) => ({ slug: i.productSlug, vendorSlug: i.vendorSlug, sku: i.sku })),
        { countryCode: shoppingLocation.countryCode, postalCode: shoppingLocation.postalCode }
      ),
      loadCatalogVendorRegistry(),
    ]);
    const bySlug = new Map(evals.map((e) => [e.slug, e]));
    const where = shoppingLocation.postalCode
      ? formatPostalDisplay(shoppingLocation.countryCode, shoppingLocation.postalCode)
      : shoppingLocation.countryCode;
    const flagged = await Promise.all(items.map(async (item) => {
      const identity = await withStoredShoppingIdentity(item);
      const decision = productAllowedForNewShopping(identity, shoppingLocation.countryCode, registry);
      const ev = bySlug.get(item.productSlug);
      const areaBlocked = Boolean(ev && !ev.deliverable);
      if (decision.available && !areaBlocked) return item;
      const unavailableReason = !decision.available
        ? decision.reason === "gbo_storefront_disabled"
          ? GBO_STOREFRONT_UNAVAILABLE_MESSAGE
          : decision.reason === "country_not_allowed"
            ? `This item cannot be delivered to ${where}.`
            : CATALOG_VENDOR_UNAVAILABLE_MESSAGE
        : `No longer available for delivery to ${where}.`;
      return {
        ...item,
        unavailableForLocation: true,
        unavailableReason,
      };
    }));
    return ok({
      cart: { items: flagged, updatedAt: raw.updatedAt ?? now() },
      locationRevalidated: true,
    });
  }
  return ok({ cart: { items, updatedAt: raw.updatedAt ?? now() } });
}

export async function addToCart(event: APIGatewayProxyEventV2) {
  let userKey: string;
  let cart: Cart & { createdAt?: string };
  try {
    const loaded = await loadCartForRequest(event);
    userKey = loaded.userKey;
    cart = loaded.cart;
  } catch {
    return unauthorized("Session or auth required");
  }

  const body = JSON.parse(event.body ?? "{}");
  const parsed = addToCartSchema.safeParse({
    ...body,
    productSlug:
      typeof body.productSlug === "string" ? body.productSlug.trim() : body.productSlug,
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Could not add this gift to your cart");
  }
  const storedCountries = await loadCatalogCountries();
  const enabledCountryCodes = storefrontShoppingCountryCodes(storedCountries.countries);
  const deliveryRejection = shoppingCountryRejection(parsed.data.deliveryCountry, enabledCountryCodes);
  if (deliveryRejection) return badRequest(deliveryRejection);
  if (enabledCountryCodes.length === 0) {
    return badRequest("Delivery is not available right now. No countries are enabled for shopping.");
  }
  if (isGboHiddenFromStorefront({ slug: parsed.data.productSlug })) {
    return badRequest(GBO_STOREFRONT_UNAVAILABLE_MESSAGE);
  }

  const productResult = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(parsed.data.productSlug), SK: productKeys.sk() },
    })
  );

  // Storefront may show catalog fallback before DynamoDB import — upsert on first add.
  let productItem = productResult.Item as Record<string, unknown> | undefined;
  if (!productItem) {
    const preview = getBundledUsarakhiProduct(parsed.data.productSlug) ?? getBundledOrangeCountyProduct(parsed.data.productSlug);
    if (preview) {
      const previewShopping = await decideNewShopping(preview, parsed.data.deliveryCountry || "US");
      if (!previewShopping.available && (previewShopping.reason === "vendor_disabled" || previewShopping.reason === "gbo_storefront_disabled")) {
        return badRequest(
          previewShopping.reason === "gbo_storefront_disabled"
            ? GBO_STOREFRONT_UNAVAILABLE_MESSAGE
            : CATALOG_VENDOR_UNAVAILABLE_MESSAGE
        );
      }
    }
    productItem = (await ensureProductInDb(parsed.data.productSlug)) ?? undefined;
  } else if (
    productItem.vendorSlug === "orange-county" ||
    productItem.categorySlug === "rakhi-hampers"
  ) {
    productItem =
      (await ensureOrangeCountyProductInDb(parsed.data.productSlug)) ?? productItem;
  } else if (
    productItem.vendorSlug === "gift-baskets-overseas" ||
    productItem.internationalDelivery === true
  ) {
    productItem = (await ensureProductInDb(parsed.data.productSlug)) ?? productItem;
  }
  if (!productItem) return badRequest("Product not found");
  if (isGboHiddenFromStorefront(productItem as { slug?: string; vendorSlug?: string; sku?: string })) {
    return badRequest(GBO_STOREFRONT_UNAVAILABLE_MESSAGE);
  }
  const shoppingDecision = await decideNewShopping(
    productItem as { slug?: string; vendorSlug?: string; sku?: string; internationalDelivery?: boolean },
    parsed.data.deliveryCountry || "US"
  );
  if (!shoppingDecision.available) {
    return badRequest(
      shoppingDecision.reason === "gbo_storefront_disabled"
        ? GBO_STOREFRONT_UNAVAILABLE_MESSAGE
        : CATALOG_VENDOR_UNAVAILABLE_MESSAGE
    );
  }

  const product = productItem as {
    slug: string;
    name: string;
    price: number;
    currency: "USD" | "INR";
    images?: string[];
    inventory: number;
    vendorSlug?: string;
    vendorCost?: number;
    sku?: string;
    couponExcluded?: boolean;
    tags?: string[];
    categorySlug?: string;
    deliveryFee?: number;
    shippingOptions?: Array<{ label: string; price: number }>;
  };

  if (product.inventory < parsed.data.quantity) {
    return badRequest("Insufficient inventory");
  }

  if (isFlashComboProduct(product.slug) && !isFlashComboSaleActive()) {
    return badRequest("This 24-hour flash offer has ended");
  }

  if (parsed.data.deliveryCountry) {
    const [row] = await evaluateProductsForLocation(
      [
        {
          slug: product.slug,
          vendorSlug: product.vendorSlug,
          inventory: product.inventory,
        },
      ],
      { countryCode: parsed.data.deliveryCountry, postalCode: parsed.data.deliveryPostal ?? "" }
    );
    if (row && !row.deliverable) {
      const where = parsed.data.deliveryPostal
        ? formatPostalDisplay(parsed.data.deliveryCountry, parsed.data.deliveryPostal)
        : parsed.data.deliveryCountry;
      return badRequest(`This product is currently not available for delivery to ${where}.`);
    }
  }

  const requestedAddons = parsed.data.addons ?? [];
  if (requestedAddons.length && !productAllowsAddons(product)) {
    return badRequest("Add-ons are not available for this product");
  }
  const resolved = resolveProductAddons(requestedAddons);
  if (!resolved.ok) return badRequest(resolved.error);
  const addons = resolved.addons;
  const shippingOptionLabel = productHasCatalogShipping(product)
    ? resolveCatalogShippingLabel(product, parsed.data.shippingOptionLabel)
    : undefined;
  const catalogShippingFee = productHasCatalogShipping(product)
    ? resolveCatalogShippingFee(product, shippingOptionLabel)
    : undefined;
  const signature = cartLineOptionsSignature(addons, shippingOptionLabel);

  // Vendor / hamper / flash fixed-price deals — do not stack competitive cuts.
  const skipCompetitive =
    Boolean(product.vendorSlug) ||
    product.categorySlug === "rakhi-hampers" ||
    productUsesFixedStorefrontPrice(product);
  const unitPrice = isFlashComboProduct(product.slug)
    ? flashComboUnitPriceUsd()
    : skipCompetitive
      ? product.price
      : applyCompetitivePriceReduction(product.price, product.currency);
  const couponExcluded =
    isFlashComboProduct(product.slug) ||
    (Boolean(product.couponExcluded) && !(product.tags ?? []).includes("tf-usa"));

  const existingIdx = cart.items.findIndex(
    (i) =>
      i.productSlug === parsed.data.productSlug &&
      cartLineOptionsSignature(i.addons, i.shippingOptionLabel) === signature
  );

  const item: CartItem = {
    lineId: uuidv4(),
    productSlug: product.slug,
    name: product.name,
    price: unitPrice,
    currency: product.currency,
    quantity: parsed.data.quantity,
    image: resolveProductImageUrl(product.images?.[0]),
    ...(product.vendorSlug ? { vendorSlug: product.vendorSlug } : {}),
    ...(typeof product.vendorCost === "number" && product.vendorCost >= 0
      ? { vendorCost: product.vendorCost }
      : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(couponExcluded ? { couponExcluded: true } : {}),
    ...(addons.length ? { addons } : {}),
    ...(catalogShippingFee != null ? { shippingFee: catalogShippingFee } : {}),
    ...(shippingOptionLabel ? { shippingOptionLabel } : {}),
  };

  if (existingIdx >= 0) {
    const newQty = cart.items[existingIdx].quantity + parsed.data.quantity;
    if (newQty > product.inventory) return badRequest("Insufficient inventory");
    cart.items[existingIdx].quantity = newQty;
    cart.items[existingIdx].price = item.price;
    if (addons.length) cart.items[existingIdx].addons = addons;
    else delete cart.items[existingIdx].addons;
    if (!cart.items[existingIdx].lineId) cart.items[existingIdx].lineId = uuidv4();
  } else {
    cart.items.push(item);
  }

  await saveCart(userKey, cart, getSessionId(event));

  const sessionId = getSessionId(event);
  if (sessionId && (parsed.data.name || parsed.data.email || parsed.data.phone)) {
    await upsertSessionProfile(sessionId, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    });
  }

  return ok({ cart });
}

export async function removeFromCart(event: APIGatewayProxyEventV2) {
  const userKey = getUserOrSessionKey(event);
  if (!userKey) return unauthorized("Session or auth required");

  const lineId = event.pathParameters?.lineId ?? event.pathParameters?.productSlug;
  if (!lineId) return badRequest("Cart line id required");

  const cart = await getCart(userKey);
  const before = cart.items.length;
  cart.items = cart.items.filter(
    (i) => i.lineId !== lineId && i.productSlug !== lineId
  );
  if (cart.items.length === before) return badRequest("Item not in cart");
  await saveCart(userKey, cart, getSessionId(event));
  return ok({ cart });
}

export async function updateCartItem(event: APIGatewayProxyEventV2) {
  const userKey = getUserOrSessionKey(event);
  if (!userKey) return unauthorized("Session or auth required");

  const lineId = event.pathParameters?.lineId ?? event.pathParameters?.productSlug;
  if (!lineId) return badRequest("Cart line id required");

  const body = JSON.parse(event.body ?? "{}");
  const quantity = Number(body.quantity);
  if (!quantity || quantity < 1) return badRequest("Valid quantity required");

  const cart = await getCart(userKey);
  const item =
    cart.items.find((i) => i.lineId === lineId) ??
    cart.items.find((i) => i.productSlug === lineId);
  if (!item) return badRequest("Item not in cart");
  if (isGboHiddenFromStorefront(item)) return badRequest(gboCartLineUnavailableMessage([item]));

  const productSlug = item.productSlug;
  let product = (
    await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk(productSlug), SK: productKeys.sk() },
      })
    )
  ).Item as { inventory: number; vendorSlug?: string; categorySlug?: string } | undefined;

  if (!product) {
    const preview = getBundledUsarakhiProduct(productSlug) ?? getBundledOrangeCountyProduct(productSlug);
    if (preview) {
      const previewShopping = await decideNewShopping(preview, "US");
      if (!previewShopping.available && (previewShopping.reason === "vendor_disabled" || previewShopping.reason === "gbo_storefront_disabled")) {
        return badRequest(
          previewShopping.reason === "gbo_storefront_disabled"
            ? GBO_STOREFRONT_UNAVAILABLE_MESSAGE
            : CATALOG_VENDOR_UNAVAILABLE_MESSAGE
        );
      }
    }
    product =
      ((await ensureProductInDb(productSlug)) as {
        inventory: number;
        vendorSlug?: string;
        categorySlug?: string;
      } | null) ?? undefined;
  } else if (product.vendorSlug === "orange-county" || product.categorySlug === "rakhi-hampers") {
    product =
      ((await ensureOrangeCountyProductInDb(productSlug)) as {
        inventory: number;
        vendorSlug?: string;
        categorySlug?: string;
      } | null) ?? product;
  }
  if (!product) return badRequest("Product not found");
  const shopping = await decideNewShopping(await withStoredShoppingIdentity({ ...item, ...product, productSlug }), "US");
  if (!shopping.available && (shopping.reason === "vendor_disabled" || shopping.reason === "gbo_storefront_disabled")) {
    return badRequest(
      shopping.reason === "gbo_storefront_disabled"
        ? GBO_STOREFRONT_UNAVAILABLE_MESSAGE
        : CATALOG_VENDOR_UNAVAILABLE_MESSAGE
    );
  }
  if (quantity > product.inventory) return badRequest("Insufficient inventory");

  item.quantity = quantity;
  if (!item.lineId) item.lineId = uuidv4();
  await saveCart(userKey, cart, getSessionId(event));
  return ok({ cart });
}

export async function clearCartForUser(userKey: string) {
  await saveCart(userKey, { items: [], updatedAt: now() });
}

export async function clearCart(event: APIGatewayProxyEventV2) {
  const userKey = getUserOrSessionKey(event);
  if (!userKey) return unauthorized("Session or auth required");

  await clearCartForUser(userKey);
  return ok({ cart: { items: [] } });
}
