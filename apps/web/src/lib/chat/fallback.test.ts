import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fallbackChatReply, isOnTopicGiftQuestion } from "./fallback";
import { whatsappChatUrl } from "../site";

describe("AI assistant fallback", () => {
  it("returns catalog product links for a flower question", () => {
    const reply = fallbackChatReply("I need birthday roses for my sister");
    assert.match(reply, /\/products\//);
    assert.doesNotMatch(reply, /I'm here specifically to help with BlossomPot/);
  });

  it("does not answer an off-topic question using gift context", () => {
    const reply = fallbackChatReply("Who is the current president?");
    assert.equal(isOnTopicGiftQuestion("Who is the current president?"), false);
    assert.match(reply, /I'm here specifically to help with BlossomPot/);
    assert.doesNotMatch(reply, /\/products\//);
  });
});

describe("AI assistant shipping", () => {
  it("answers shipping questions with worldwide delivery, not USA-only", () => {
    const reply = fallbackChatReply("How long is shipping?");
    assert.match(reply, /worldwide/i);
    assert.match(reply, /Shipping & Delivery/);
  });
});

describe("WhatsApp support link", () => {
  it("opens the official support number with a pre-filled message", () => {
    const url = whatsappChatUrl();
    assert.equal(url.startsWith("https://wa.me/919266467887?text="), true);
    assert.match(url, /Hi%20BlossomPot/);
  });
});
