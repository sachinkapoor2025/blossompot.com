/**
 * Infer additional storefront categories for Orange County hamper products.
 * Primary category stays `rakhi-hampers`; these extras make items appear in
 * Single / Kids / Combo / etc. grids as well.
 */
export function inferAdditionalCategorySlugs(name: string, details: string): string[] {
  const text = `${name}\n${details}`.toLowerCase();
  const cats = new Set<string>();

  const isKids =
    /\bkids?\b|\bcartoon\b|\bchhota\b|\bdoraemon\b|\bmickey\b|\bbro\b.*rakhi|\brakhi\b.*\bbro\b/.test(
      text
    );
  if (isKids) cats.add("kids-rakhi");

  if (/\blumba\b|\bbhabhi\b/.test(text) && !/\bbhaiya\s*bhabhi\b|\bbhai\s*bhabhi\b/.test(text)) {
    cats.add("lumba-rakhi");
  }
  if (/\bbhaiya\s*bhabhi\b|\bbhai\s*bhabhi\b/.test(text)) {
    cats.add("bhaiya-bhabhi-rakhi");
  }

  const multiRakhi =
    /\bset of\s*[2-9]\b|\bpair of\s*2\b|\b\d+\s*rakhis?\b|\btwin\b|\btrio\b|\bduo\b|\b3\s*in\s*1\b|\b4\s*pack\b|\b5\s*in\s*1\b/.test(
      text
    );

  const isSingle =
    !isKids &&
    !multiRakhi &&
    (/\bsingle\s*rakhi\b/.test(text) ||
      /^\s*1[\s\-.)]*single\s*rakhi/im.test(details) ||
      (/^\s*1[\s\-.)]/im.test(details) && /\brakhi\b/.test(text)) ||
      // Solo rakhi gift (not a pair/set) — e.g. "Evil Eyes Rakhi with Dairy milk"
      (/\brakhi\b/.test(text) && !/\bpair of\b|\bset of\b|\b\d+\s*rakhis?\b/.test(text)));

  if (isSingle) cats.add("single-rakhi");

  // Chocolate-forward gift → also list under Rakhi Combo.
  if (
    /\bchocolate|\bferrero|\bdairy\s*milk|\blindt|\blindor|\bsnicker|\bhershey|\bkitkat\b/.test(text)
  ) {
    cats.add("rakhi-combo");
  }

  return [...cats];
}
