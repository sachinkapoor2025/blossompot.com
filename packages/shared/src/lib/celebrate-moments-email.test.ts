import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderSesTemplate } from "../schemas/ses-email";
import { EMAIL_IMAGE_ALLOWLIST } from "./email-images";
import {
  CAMPAIGN_SHOP_BUTTONS,
  buildCelebrateMomentsEmailHtml,
  shopButtonsForRecipient,
} from "./celebrate-moments-email";

function buttonLabels(html: string): string[] {
  return [...html.matchAll(/data-shop-slot="[12]"[^>]*>\s*([^<]+)/g)].map((match) =>
    (match[1] ?? "").replace(/\s+/g, " ").replace(/ ›| &#8250;/g, "").trim()
  );
}

describe("celebrate moments campaign email", () => {
  it("shows Shop Birthday and Shop Anniversary links on the design", () => {
    const html = buildCelebrateMomentsEmailHtml();
    assert.match(html, /Happy Birthday!/);
    assert.match(html, /Happy Anniversary!/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/birthday-gifts"/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/anniversary-gifts"/);
    assert.match(html, /Shop Birthday/);
    assert.match(html, /Shop Anniversary/);
    assert.match(html, /\{\{unsubscribe\}\}/);
    for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
      const src = /src="([^"]+)"/.exec(tag[0])?.[1];
      assert.equal(EMAIL_IMAGE_ALLOWLIST.includes(src ?? ""), true, src);
    }
  });

  it("gives each recipient a different shop button and leaves other mail unchanged", () => {
    const html = buildCelebrateMomentsEmailHtml();
    const first = renderSesTemplate(html, { email: "avery@example.com", name: "Avery" });
    const again = renderSesTemplate(html, { email: "avery@example.com", name: "Avery" });
    assert.equal(first, again);

    const labels = new Set<string>();
    for (const email of ["avery@example.com", "blair@example.com", "casey@example.com", "drew@example.com", "eden@example.com"]) {
      const sent = renderSesTemplate(html, { email });
      const pair = shopButtonsForRecipient(email);
      assert.notEqual(pair[0].href, pair[1].href);
      assert.ok(sent.includes(`href="${pair[0].href}"`));
      assert.ok(sent.includes(`href="${pair[1].href}"`));
      assert.ok(sent.includes(pair[0].label));
      assert.ok(sent.includes(pair[1].label));
      labels.add(pair.map((button) => button.label).join("|"));
      for (const href of [...sent.matchAll(/data-shop-slot="[12]"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*data-shop-slot="[12]"/g)].map(
        (match) => match[1] || match[2]
      )) {
        assert.equal(href?.startsWith("https://www.blossompot.com/"), true, href);
      }
    }
    assert.ok(labels.size > 1);

    const other = "<p>Hello {{name}}</p><a href=\"https://www.blossompot.com/cakes\">Shop Cakes</a>";
    assert.equal(
      renderSesTemplate(other, { name: "Nia", email: "nia@example.com" }),
      "<p>Hello Nia</p><a href=\"https://www.blossompot.com/cakes\">Shop Cakes</a>"
    );
    assert.equal(buttonLabels(first).length, 2);
    assert.ok(CAMPAIGN_SHOP_BUTTONS.some((button) => first.includes(button.label)));
  });
});
