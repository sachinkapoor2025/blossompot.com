/** Shared hamper description builders for import + catalog generate. */

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Normalize vendor Excel inclusion lines into readable storefront copy. */
export function normalizeInclusionLine(raw: string): string {
  let line = raw
    .replace(/^\s*\d+\s*[-.)]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!line) return "";

  line = line
    .replace(/\b(\d+)\s*gms?\b/gi, "$1 g")
    .replace(/\b(\d+)\s*g\s+/gi, "$1 g ")
    .replace(/\b(\d+)\s*g\s*kk\b/gi, "$1 g Kaju Katli")
    .replace(/\bkk\b/gi, "Kaju Katli")
    .replace(/\bpc\b/gi, "pc")
    .replace(/\bSoap Papdi\b/gi, "Soan Papdi")
    .replace(/\bSoan papdi\b/gi, "Soan Papdi")
    .replace(/\bBesan Laddo\b/gi, "Besan Laddoo")
    .replace(/\bferrero\b/gi, "Ferrero")
    .replace(/\bChocolates\b/g, "chocolates")
    .replace(/\bcashew\b/gi, "cashews")
    .replace(/\bPistachios\b/g, "pistachios")
    .replace(/\bAlmonds\b/g, "almonds")
    .replace(/\bsingle Rakhi\b/gi, "1 designer Single Rakhi")
    .replace(/\bset of 2 Rakhi\b/gi, "Set of 2 designer Rakhis");

  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** Split combined Roli/Chawal vendor lines into two checklist items. */
function expandRitualLines(line: string): string[] {
  const t = line.replace(/\.$/, "").trim();
  if (/^complimentary\s+roli\s*(?:&|and|-)?\s*chawal\b/i.test(t)) {
    return ["Complimentary Roli", "Complimentary Chawal (Rice)"];
  }
  if (/^roli\s*(?:&|and|-|–)?\s*chawal\s+dibbi$/i.test(t)) {
    return ["Small Roli box", "Small Chawal box"];
  }
  if (/^roli\s+dibbi$/i.test(t)) return ["Small Roli box"];
  if (/^chawal\s+dibbi$/i.test(t)) return ["Small Chawal box"];
  if (/^chawal\s+(?:designer\s+)?tikka(?:\s+set)?$/i.test(t)) {
    return [];
  }
  if (
    /^roli\s*(?:&|and|-|–)?\s*chawal\s+(?:designer\s+)?tikka(?:\s+set)?$/i.test(t) ||
    /^roli\s+(?:designer\s+)?tikka(?:\s+set)?$/i.test(t)
  ) {
    return ["Roli", "Chawal", "Designer tikka set"];
  }
  if (/^roli\s*(?:&|and|-|–)?\s*chawal$/i.test(t)) {
    return ["Roli", "Chawal (Rice)"];
  }
  const combined = t.match(/^roli\s*(?:&|and|-|–)?\s*chawal\s+(.+)$/i);
  if (combined?.[1]) {
    const rest = combined[1].trim();
    if (/(?:designer\s+)?tikka/i.test(rest)) {
      return ["Roli", "Chawal", "Designer tikka set"];
    }
    return [`Roli ${rest}`, `Chawal ${rest}`];
  }
  return [t];
}

export function parseInclusionLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map(normalizeInclusionLine)
    .filter(Boolean)
    .flatMap(expandRitualLines);
}

/** Unique SEO meta from inclusions + name (no HTML). */
export function buildHamperSeoDescription(
  name: string,
  rawInclusions: string,
  salePrice: number
): string {
  const items = parseInclusionLines(rawInclusions);
  const highlights =
    items.length > 0
      ? items.slice(0, 4).join(", ")
      : "designer rakhi, Indian sweets, and dry fruits";
  return `Send ${name} to USA — Rakhi hamper gift box with ${highlights}. Sale $${salePrice.toFixed(2)}. Domestic USA delivery for Raksha Bandhan. Order online from India worldwide.`;
}

export function buildHamperHtmlDescription(name: string, rawInclusions: string, sku: string): string {
  const items = parseInclusionLines(rawInclusions);
  const list =
    items.length > 0
      ? `<ul>${items.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
      : `<p>${escapeHtml(rawInclusions.trim() || "Premium festive contents — see product photos for details.")}</p>`;

  const qtyNote =
    items.length > 0
      ? `<p>Every item above ships together in one gift hamper — quantities are as listed (grams / pieces). Perfect when you want to <strong>send a Rakhi gift hamper to USA</strong> without buying sweets separately.</p>`
      : "";

  return [
    `<p><strong>${escapeHtml(name)}</strong> is a premium <strong>Rakhi hamper</strong> for USA delivery. Sisters in India, the UK, Canada, and worldwide order this festive gift box so brothers across America receive designer rakhis with traditional sweets and dry fruits — shipped domestically within the United States for reliable Raksha Bandhan delivery.</p>`,
    `<p>Unlike a simple thread-only gift, this hamper turns Raksha Bandhan into a full celebration: sweets for the family, dry fruits for sharing, and roli chawal or tilak essentials where listed. Ideal if you searched for a <strong>rakhi gift hamper</strong>, <strong>rakhi with dry fruits</strong>, or a ready-to-gift <strong>Rakhi mithai box USA</strong>.</p>`,
    `<p><strong>What's included in this hamper:</strong></p>`,
    list,
    qtyNote,
    `<p><strong>Why sisters choose this hamper for USA delivery:</strong></p>`,
    `<ul><li>Clear what's-included list with quantities</li><li>Domestic USA shipping — no international customs delay for your brother</li><li>Festive packaging ready for Raksha Bandhan 2026</li><li>Secure checkout in USD (Stripe) or INR (Razorpay)</li></ul>`,
    `<p>Looking for more options? Browse our <a href="/rakhi-combo-to-usa">Rakhi Combos</a> with chocolates, <a href="/single-rakhi-to-usa">Single Rakhi</a> designs, <a href="/kids-rakhi-to-usa">Kids Rakhi</a>, <a href="/bhaiya-bhabhi-rakhi-to-usa">Bhaiya Bhabhi sets</a>, or shop all <a href="/rakhi-hampers-to-usa">Rakhi Hampers</a> for USA delivery. Read our guide: <a href="/blog/rakhi-hamper-gift-box-usa">How to choose a Rakhi hamper gift box for USA</a>.</p>`,
    `<p>SKU: ${escapeHtml(sku)}</p>`,
  ].join("\n");
}
