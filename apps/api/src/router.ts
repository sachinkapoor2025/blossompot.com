import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ok, notFound, corsPreflight } from "./lib/response";
import * as products from "./handlers/products";
import * as categories from "./handlers/categories";
import * as cart from "./handlers/cart";
import * as orders from "./handlers/orders";
import * as orderRoute from "./handlers/order-route";
import * as config from "./handlers/config";
import * as uploads from "./handlers/uploads";
import * as events from "./handlers/events";
import * as analytics from "./handlers/analytics";
import * as salesReport from "./handlers/sales-report";
import * as productSalesIntel from "./handlers/product-sales-intelligence";
import * as trackingSync from "./handlers/tracking-sync";
import * as adminCarts from "./handlers/admin-carts";
import * as adminCustomers from "./handlers/admin-customers";
import * as account from "./handlers/account";
import * as coupons from "./handlers/coupons";
import * as sesEmail from "./handlers/ses-email";
import * as reminderEmails from "./handlers/reminder-emails";
import * as pendingPaymentUnsub from "./handlers/pending-payment-unsub";
import * as shipping from "./handlers/shipping";
import * as loadTest from "./handlers/load-test";
import * as adminVendorApi from "./handlers/admin-vendor-api";
import * as expenses from "./handlers/expenses";
import * as paymentLedger from "./handlers/payment-ledger";
import * as paymentReconciliation from "./handlers/payment-reconciliation";
import * as vendorManagement from "./handlers/vendor-management";
import * as marketplaceVendors from "./handlers/marketplace-vendors";
import * as reviews from "./handlers/reviews";
import { stripeWebhook } from "./handlers/payments/stripe";
import {
  razorpayWebhook,
  verifyRazorpayPayment,
  syncAdminOrderPayment,
} from "./handlers/payments/razorpay";

type RouteHandler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  params?: string[];
}

const routes: Route[] = [
  { method: "GET", pattern: /^\/health$/, handler: async () => ok({ status: "ok" }) },
  { method: "GET", pattern: /^\/products$/, handler: products.listProducts },
  { method: "GET", pattern: /^\/products\/([^/]+)$/, handler: products.getProduct, params: ["slug"] },
  {
    method: "GET",
    pattern: /^\/products\/([^/]+)\/reviews$/,
    handler: reviews.listProductReviews,
    params: ["slug"],
  },
  {
    method: "POST",
    pattern: /^\/products\/([^/]+)\/reviews$/,
    handler: reviews.createProductReview,
    params: ["slug"],
  },
  { method: "POST", pattern: /^\/products$/, handler: products.createProduct },
  { method: "PUT", pattern: /^\/products\/([^/]+)$/, handler: products.updateProduct, params: ["slug"] },
  { method: "DELETE", pattern: /^\/products\/([^/]+)$/, handler: products.deleteProduct, params: ["slug"] },
  { method: "GET", pattern: /^\/admin\/products$/, handler: products.listAdminProducts },
  { method: "DELETE", pattern: /^\/admin\/products\/sample$/, handler: products.deleteAllSampleProducts },
  {
    method: "POST",
    pattern: /^\/admin\/products\/([^/]+)\/convert-from-sample$/,
    handler: products.convertSampleProductToReal,
    params: ["slug"],
  },
  { method: "POST", pattern: /^\/products\/bulk$/, handler: products.bulkUploadProducts },
  { method: "GET", pattern: /^\/categories$/, handler: categories.listCategories },
  { method: "GET", pattern: /^\/categories\/([^/]+)$/, handler: categories.getCategory, params: ["slug"] },
  { method: "POST", pattern: /^\/categories$/, handler: categories.createCategory },
  { method: "PUT", pattern: /^\/categories\/([^/]+)$/, handler: categories.updateCategory, params: ["slug"] },
  { method: "DELETE", pattern: /^\/categories\/([^/]+)$/, handler: categories.deleteCategory, params: ["slug"] },
  { method: "GET", pattern: /^\/cart$/, handler: cart.getCartHandler },
  { method: "POST", pattern: /^\/cart\/items$/, handler: cart.addToCart },
  { method: "PUT", pattern: /^\/cart\/items\/([^/]+)$/, handler: cart.updateCartItem, params: ["lineId"] },
  { method: "DELETE", pattern: /^\/cart\/items\/([^/]+)$/, handler: cart.removeFromCart, params: ["lineId"] },
  { method: "DELETE", pattern: /^\/cart$/, handler: cart.clearCart },
  { method: "POST", pattern: /^\/checkout$/, handler: orders.checkout },
  { method: "GET", pattern: /^\/shipping\/rates$/, handler: shipping.getShippingRates },
  { method: "GET", pattern: /^\/admin\/shipping\/settings$/, handler: shipping.getAdminShippingSettings },
  { method: "PUT", pattern: /^\/admin\/shipping\/settings$/, handler: shipping.updateAdminShippingSettings },
  { method: "POST", pattern: /^\/admin\/orders\/([^/]+)\/buy-label$/, handler: shipping.buyLabelForOrder, params: ["orderId"] },
  {
    method: "POST",
    pattern: /^\/admin\/orders\/([^/]+)\/sync-payment$/,
    handler: syncAdminOrderPayment,
    params: ["orderId"],
  },
  { method: "POST", pattern: /^\/admin\/orders\/([^/]+)\/rates$/, handler: shipping.getOrderShippingRates, params: ["orderId"] },
  { method: "GET", pattern: /^\/admin\/shipping\/products-missing-dims$/, handler: shipping.listProductsMissingDims },
  { method: "GET", pattern: /^\/admin\/load-test$/, handler: loadTest.getLoadTestInfo },
  { method: "POST", pattern: /^\/admin\/load-test\/run$/, handler: loadTest.runLoadTest },
  // Super admin: business expense ledger
  { method: "GET", pattern: /^\/admin\/expenses$/, handler: expenses.listExpenses },
  { method: "POST", pattern: /^\/admin\/expenses$/, handler: expenses.createExpense },
  {
    method: "PUT",
    pattern: /^\/admin\/expenses\/([^/]+)$/,
    handler: expenses.updateExpense,
    params: ["expenseId"],
  },
  {
    method: "DELETE",
    pattern: /^\/admin\/expenses\/([^/]+)$/,
    handler: expenses.deleteExpense,
    params: ["expenseId"],
  },
  // Super admin: payment gateway receipts ledger
  { method: "GET", pattern: /^\/admin\/payment-ledger$/, handler: paymentLedger.listPaymentLedger },
  { method: "POST", pattern: /^\/admin\/payment-ledger$/, handler: paymentLedger.createPaymentLedgerEntry },
  {
    method: "POST",
    pattern: /^\/admin\/payment-ledger\/bulk$/,
    handler: paymentLedger.bulkCreatePaymentLedgerEntries,
  },
  {
    method: "PUT",
    pattern: /^\/admin\/payment-ledger\/([^/]+)$/,
    handler: paymentLedger.updatePaymentLedgerEntry,
    params: ["paymentId"],
  },
  {
    method: "DELETE",
    pattern: /^\/admin\/payment-ledger\/([^/]+)$/,
    handler: paymentLedger.deletePaymentLedgerEntry,
    params: ["paymentId"],
  },
  {
    method: "GET",
    pattern: /^\/admin\/payment-reconciliation$/,
    handler: paymentReconciliation.getPaymentReconciliation,
  },
  // Super admin: vendor order economics + payout ledger (website API, not vendor API)
  {
    method: "GET",
    pattern: /^\/admin\/vendor-management$/,
    handler: vendorManagement.getVendorManagement,
  },
  { method: "GET", pattern: /^\/admin\/vendor-payouts$/, handler: vendorManagement.listVendorPayouts },
  { method: "POST", pattern: /^\/admin\/vendor-payouts$/, handler: vendorManagement.createVendorPayout },
  {
    method: "PUT",
    pattern: /^\/admin\/vendor-payouts\/([^/]+)$/,
    handler: vendorManagement.updateVendorPayout,
    params: ["payoutId"],
  },
  {
    method: "DELETE",
    pattern: /^\/admin\/vendor-payouts\/([^/]+)$/,
    handler: vendorManagement.deleteVendorPayout,
    params: ["payoutId"],
  },
  // Marketplace vendor partners (signup, portal, admin review)
  { method: "GET", pattern: /^\/marketplace\/vendor-agreement$/, handler: marketplaceVendors.getVendorAgreement },
  { method: "GET", pattern: /^\/marketplace\/coverage$/, handler: marketplaceVendors.marketplaceCoverageByZip },
  { method: "POST", pattern: /^\/marketplace\/vendors\/apply$/, handler: marketplaceVendors.applyMarketplaceVendor },
  { method: "POST", pattern: /^\/marketplace\/vendors\/login$/, handler: marketplaceVendors.vendorLogin },
  { method: "POST", pattern: /^\/marketplace\/vendors\/logout$/, handler: marketplaceVendors.vendorLogout },
  { method: "GET", pattern: /^\/marketplace\/vendors\/me$/, handler: marketplaceVendors.vendorMe },
  { method: "GET", pattern: /^\/marketplace\/vendors\/dashboard$/, handler: marketplaceVendors.vendorDashboard },
  { method: "GET", pattern: /^\/marketplace\/vendors\/products$/, handler: marketplaceVendors.vendorListProducts },
  { method: "POST", pattern: /^\/marketplace\/vendors\/products$/, handler: marketplaceVendors.vendorUpsertProduct },
  { method: "GET", pattern: /^\/marketplace\/vendors\/orders$/, handler: marketplaceVendors.vendorListOrders },
  {
    method: "POST",
    pattern: /^\/marketplace\/vendors\/orders\/([^/]+)\/actions$/,
    handler: marketplaceVendors.vendorUpdateOrder,
    params: ["orderId"],
  },
  { method: "POST", pattern: /^\/marketplace\/vendors\/pricing\/preview$/, handler: marketplaceVendors.previewVendorPricing },
  { method: "GET", pattern: /^\/admin\/marketplace\/vendors$/, handler: marketplaceVendors.listMarketplaceVendorsAdmin },
  {
    method: "GET",
    pattern: /^\/admin\/marketplace\/vendors\/([^/]+)$/,
    handler: marketplaceVendors.getMarketplaceVendorAdmin,
    params: ["vendorId"],
  },
  {
    method: "PATCH",
    pattern: /^\/admin\/marketplace\/vendors\/([^/]+)\/status$/,
    handler: marketplaceVendors.updateMarketplaceVendorStatusAdmin,
    params: ["vendorId"],
  },
  { method: "GET", pattern: /^\/admin\/marketplace\/products$/, handler: marketplaceVendors.adminListVendorProducts },
  {
    method: "PATCH",
    pattern: /^\/admin\/marketplace\/products\/([^/]+)\/approval$/,
    handler: marketplaceVendors.adminApproveVendorProduct,
    params: ["slug"],
  },
  { method: "GET", pattern: /^\/admin\/marketplace\/commissions$/, handler: marketplaceVendors.getVendorCommissionsAdmin },
  { method: "PUT", pattern: /^\/admin\/marketplace\/commissions$/, handler: marketplaceVendors.putVendorCommissionsAdmin },
  // Admin console for Orange County Vendor API (proxies vendor handlers; key stays server-side).
  { method: "GET", pattern: /^\/admin\/vendor-api\/health$/, handler: adminVendorApi.adminVendorHealth },
  { method: "GET", pattern: /^\/admin\/vendor-api\/auth-check$/, handler: adminVendorApi.adminVendorAuthCheck },
  { method: "GET", pattern: /^\/admin\/vendor-api\/orders$/, handler: adminVendorApi.adminVendorListOrders },
  {
    method: "GET",
    pattern: /^\/admin\/vendor-api\/orders\/([^/]+)$/,
    handler: adminVendorApi.adminVendorGetOrder,
    params: ["orderId"],
  },
  { method: "POST", pattern: /^\/admin\/vendor-api\/shipment$/, handler: adminVendorApi.adminVendorPostShipment },
  { method: "POST", pattern: /^\/admin\/vendor-api\/tracking$/, handler: adminVendorApi.adminVendorPostTracking },
  // Orange County vendor feed is ONLY on dedicated VendorHttpApi (vendor-api.ts / VendorApiUrl).
  { method: "GET", pattern: /^\/orders$/, handler: orders.listOrders },
  {
    method: "GET",
    pattern: /^\/orders\/([^/]+)\/tracking$/,
    handler: trackingSync.getOrderTracking,
    params: ["orderId"],
  },
  { method: "GET", pattern: /^\/orders\/([^/]+)$/, handler: orders.getOrder, params: ["orderId"] },
  { method: "POST", pattern: /^\/orders\/([^/]+)\/retry-payment$/, handler: orders.retryOrderPayment, params: ["orderId"] },
  { method: "GET", pattern: /^\/account$/, handler: account.getAccount },
  { method: "PUT", pattern: /^\/account\/profile$/, handler: account.updateAccountProfile },
  { method: "POST", pattern: /^\/account\/addresses$/, handler: account.createAccountAddress },
  { method: "PUT", pattern: /^\/account\/addresses\/([^/]+)$/, handler: account.updateAccountAddress, params: ["addressId"] },
  { method: "DELETE", pattern: /^\/account\/addresses\/([^/]+)$/, handler: account.deleteAccountAddress, params: ["addressId"] },
  { method: "GET", pattern: /^\/admin\/orders$/, handler: orders.listAdminOrders },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/order-routes$/,
    handler: orderRoute.listAdminOrderRoutes,
  },
  {
    method: "GET",
    pattern: /^\/admin\/orders\/([^/]+)\/route$/,
    handler: orderRoute.getAdminOrderRoute,
    params: ["orderId"],
  },
  { method: "GET", pattern: /^\/admin\/orders\/([^/]+)$/, handler: orders.getAdminOrder, params: ["orderId"] },
  {
    method: "POST",
    pattern: /^\/admin\/orders\/([^/]+)\/tracking\/sync$/,
    handler: trackingSync.syncAdminOrderTracking,
    params: ["orderId"],
  },
  { method: "PATCH", pattern: /^\/admin\/orders\/([^/]+)$/, handler: orders.updateOrderStatus, params: ["orderId"] },
  { method: "PUT", pattern: /^\/admin\/orders\/([^/]+)$/, handler: orders.updateOrderStatus, params: ["orderId"] },
  { method: "GET", pattern: /^\/admin\/leads$/, handler: orders.listLeads },
  { method: "PATCH", pattern: /^\/admin\/leads$/, handler: orders.updateLead },
  { method: "GET", pattern: /^\/admin\/analytics\/overview$/, handler: analytics.getAnalyticsOverview },
  { method: "GET", pattern: /^\/admin\/analytics\/sales$/, handler: salesReport.getSalesReport },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/product-sales$/,
    handler: productSalesIntel.getProductSalesSummary,
  },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/product-sales\/products$/,
    handler: productSalesIntel.listProductSalesProducts,
  },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/product-sales\/products\/([^/]+)$/,
    handler: productSalesIntel.getProductSalesDetail,
    params: ["slug"],
  },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/product-sales\/compare$/,
    handler: productSalesIntel.compareProductSales,
  },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/product-sales\/export$/,
    handler: productSalesIntel.exportProductSales,
  },
  {
    method: "POST",
    pattern: /^\/admin\/analytics\/product-sales\/rebuild$/,
    handler: productSalesIntel.rebuildProductSales,
  },
  {
    method: "GET",
    pattern: /^\/admin\/analytics\/product-sales\/config$/,
    handler: productSalesIntel.getProductSalesConfig,
  },
  {
    method: "PUT",
    pattern: /^\/admin\/analytics\/product-sales\/config$/,
    handler: productSalesIntel.updateProductSalesConfig,
  },
  { method: "GET", pattern: /^\/admin\/analytics\/products$/, handler: analytics.getTopProducts },
  { method: "GET", pattern: /^\/admin\/analytics\/searches$/, handler: analytics.getTopSearches },
  { method: "GET", pattern: /^\/admin\/analytics\/insights$/, handler: analytics.getAnalyticsInsights },
  { method: "GET", pattern: /^\/admin\/analytics\/visitors$/, handler: analytics.getVisitorAnalytics },
  { method: "GET", pattern: /^\/admin\/live-visitors$/, handler: analytics.listLiveVisitors },
  { method: "GET", pattern: /^\/admin\/sessions$/, handler: analytics.listSessions },
  { method: "GET", pattern: /^\/admin\/sessions\/([^/]+)$/, handler: analytics.getSessionTimeline, params: ["sessionId"] },
  { method: "GET", pattern: /^\/admin\/carts\/abandoned$/, handler: adminCarts.getAbandonedCarts },
  { method: "GET", pattern: /^\/admin\/customers\/([^/]+)$/, handler: adminCustomers.getCustomerProfile, params: ["email"] },
  { method: "GET", pattern: /^\/admin\/search$/, handler: adminCustomers.adminSearch },
  { method: "POST", pattern: /^\/coupons\/validate$/, handler: coupons.validateCouponHandler },
  { method: "GET", pattern: /^\/admin\/welcome-coupons$/, handler: coupons.listWelcomeCoupons },
  { method: "POST", pattern: /^\/admin\/coupons\/abandoned$/, handler: coupons.createAdminAbandonedCoupon },
  { method: "GET", pattern: /^\/admin\/coupons\/abandoned$/, handler: coupons.listAdminCoupons },
  { method: "POST", pattern: /^\/leads$/, handler: orders.captureLead },
  {
    method: "POST",
    pattern: /^\/pending-payment-unsubscribe$/,
    handler: pendingPaymentUnsub.unsubscribePendingPaymentReminders,
  },
  { method: "POST", pattern: /^\/events$/, handler: events.recordEvent },
  { method: "GET", pattern: /^\/config\/payments$/, handler: config.getPaymentConfig },
  { method: "GET", pattern: /^\/config\/usd-inr-rate$/, handler: config.getUsdInrRate },
  { method: "PUT", pattern: /^\/config\/payments$/, handler: config.updatePaymentConfig },
  { method: "GET", pattern: /^\/blog-images$/, handler: config.getBlogImages },
  { method: "PUT", pattern: /^\/admin\/blog-images$/, handler: config.updateBlogImages },
  { method: "POST", pattern: /^\/uploads\/presign$/, handler: uploads.getUploadUrl },
  { method: "POST", pattern: /^\/products\/([^/]+)\/images$/, handler: uploads.attachImageToProduct, params: ["slug"] },
  { method: "DELETE", pattern: /^\/products\/([^/]+)\/images$/, handler: uploads.deleteImageFromProduct, params: ["slug"] },
  { method: "POST", pattern: /^\/webhooks\/stripe$/, handler: stripeWebhook },
  { method: "POST", pattern: /^\/webhooks\/razorpay$/, handler: razorpayWebhook },
  /** Mailercloud bounce/complaint/unsub → marketing SUPPRESS# (no SMTP credential changes). */
  { method: "POST", pattern: /^\/webhooks\/mailercloud$/, handler: sesEmail.mailercloudWebhook },
  { method: "POST", pattern: /^\/payments\/razorpay\/verify$/, handler: verifyRazorpayPayment },

  // SES bulk email campaigns (admin)
  { method: "GET", pattern: /^\/ses-email\/dashboard$/, handler: sesEmail.getDashboard },
  { method: "GET", pattern: /^\/ses-email\/campaigns$/, handler: sesEmail.listCampaigns },
  { method: "POST", pattern: /^\/ses-email\/campaigns$/, handler: sesEmail.createCampaign },
  { method: "GET", pattern: /^\/ses-email\/campaigns\/([^/]+)$/, handler: sesEmail.getCampaignHandler, params: ["campaignId"] },
  { method: "PUT", pattern: /^\/ses-email\/campaigns\/([^/]+)$/, handler: sesEmail.updateCampaign, params: ["campaignId"] },
  { method: "POST", pattern: /^\/ses-email\/recipients$/, handler: sesEmail.uploadRecipients },
  { method: "GET", pattern: /^\/ses-email\/templates$/, handler: sesEmail.listTemplates },
  { method: "POST", pattern: /^\/ses-email\/templates$/, handler: sesEmail.createTemplate },
  { method: "GET", pattern: /^\/ses-email\/templates\/([^/]+)$/, handler: sesEmail.getTemplateHandler, params: ["templateId"] },
  { method: "PUT", pattern: /^\/ses-email\/templates\/([^/]+)$/, handler: sesEmail.updateTemplate, params: ["templateId"] },
  { method: "DELETE", pattern: /^\/ses-email\/templates\/([^/]+)$/, handler: sesEmail.deleteTemplate, params: ["templateId"] },
  { method: "GET", pattern: /^\/ses-email\/settings$/, handler: sesEmail.getSettings },
  { method: "PUT", pattern: /^\/ses-email\/settings$/, handler: sesEmail.updateSettings },
  { method: "GET", pattern: /^\/ses-email\/suppression$/, handler: sesEmail.listSuppression },
  { method: "POST", pattern: /^\/ses-email\/suppression$/, handler: sesEmail.addSuppression },
  { method: "DELETE", pattern: /^\/ses-email\/suppression\/([^/]+)$/, handler: sesEmail.removeSuppression, params: ["email"] },
  { method: "GET", pattern: /^\/ses-email\/queue$/, handler: sesEmail.listQueue },
  { method: "GET", pattern: /^\/ses-email\/analytics$/, handler: sesEmail.getAnalytics },
  { method: "GET", pattern: /^\/ses-email\/analytics\/recipients$/, handler: sesEmail.listAnalyticsRecipients },
  { method: "POST", pattern: /^\/ses-email\/bounces\/sync$/, handler: sesEmail.syncBouncesHandler },
  { method: "GET", pattern: /^\/ses-email\/notifications$/, handler: sesEmail.listNotifications },
  { method: "POST", pattern: /^\/ses-email\/test$/, handler: sesEmail.sendTest },
  { method: "GET", pattern: /^\/ses-email\/reminders$/, handler: reminderEmails.listReminderEmailsHandler },
  { method: "POST", pattern: /^\/ses-email\/reminders\/collect$/, handler: reminderEmails.collectReminderEmailsHandler },
  { method: "POST", pattern: /^\/ses-email\/reminders\/send$/, handler: reminderEmails.sendReminderEmailsHandler },
  { method: "POST", pattern: /^\/ses-email\/reminders\/delete$/, handler: reminderEmails.bulkDeleteReminderEmailsHandler },
  { method: "DELETE", pattern: /^\/ses-email\/reminders\/([^/]+)$/, handler: reminderEmails.deleteReminderEmailHandler, params: ["email"] },
  { method: "GET", pattern: /^\/email\/open\/([^/]+)$/, handler: sesEmail.trackOpen, params: ["token"] },
  { method: "GET", pattern: /^\/email\/click\/([^/]+)$/, handler: sesEmail.trackClick, params: ["token"] },
  { method: "GET", pattern: /^\/email\/unsubscribe\/([^/]+)$/, handler: sesEmail.unsubscribe, params: ["token"] },
];

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  let path = event.rawPath ?? event.requestContext.http.path ?? "/";
  const stage = event.requestContext.stage;
  // HTTP API includes stage in path (e.g. /prod/products) — strip it for routing
  if (stage && path.startsWith(`/${stage}/`)) {
    path = path.slice(stage.length + 1);
  } else if (stage && path === `/${stage}`) {
    path = "/";
  }

  const method = event.requestContext.http.method;

  if (method === "OPTIONS") {
    return corsPreflight();
  }

  for (const routeDef of routes) {
    if (routeDef.method !== method) continue;
    const match = path.match(routeDef.pattern);
    if (!match) continue;

    if (routeDef.params) {
      const params: Record<string, string> = {};
      routeDef.params.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      event.pathParameters = { ...event.pathParameters, ...params };
    }

    return routeDef.handler(event);
  }

  return notFound(`Route not found: ${method} ${path}`);
}
