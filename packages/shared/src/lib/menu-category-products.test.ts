import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productFitsMenuCategory } from "./menu-category-products";

function gift(categorySlug: string, name: string) {
  return { categorySlug, name, description: `Send ${name} across the USA with BlossomPot.`, tags: ["fnp-usa-import"] };
}

describe("menu category product matching", () => {
  it("puts birthday blooms and party cakes on Birthday and leaves plain flowers off", () => {
    assert.equal(
      productFitsMenuCategory(gift("flowers", "Festive Floral Garden with Birthday Balloon Regular"), "birthday-gifts"),
      true
    );
    assert.equal(
      productFitsMenuCategory(gift("flower-bouquets", "Brilliant Birthday Blooms Bouquet Premium"), "birthday-gifts"),
      true
    );
    assert.equal(productFitsMenuCategory(gift("cakes", "Birthday Strawberry Funfetti Cake"), "birthday-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "Hello Kitty Strawberry Cake"), "birthday-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "The Best Wishes Cake"), "birthday-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("flowers", "Anything For You Premium"), "birthday-gifts"), false);
    assert.equal(
      productFitsMenuCategory(gift("cakes", "Anniversary Delectable Carrot Cake"), "birthday-gifts"),
      false
    );
    assert.equal(productFitsMenuCategory(gift("cakes", "Delicious Valentines Day Cupcakes"), "birthday-gifts"), false);
  });

  it("puts roses and anniversary cakes on Anniversary, not kids cakes", () => {
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Classic Romance Red Roses"), "anniversary-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("flowers", "Love Is In The Air Premium"), "anniversary-gifts"), true);
    assert.equal(
      productFitsMenuCategory(gift("cakes", "Anniversary Triple Chocolate Enrobed Brownie Cake"), "anniversary-gifts"),
      true
    );
    assert.equal(productFitsMenuCategory(gift("cakes", "Mickey Mouse Chocolate Cake"), "anniversary-gifts"), false);
    assert.equal(
      productFitsMenuCategory(gift("flower-bouquets", "One Dozen Red Roses with Birthday Pick"), "anniversary-gifts"),
      false
    );
    assert.equal(
      productFitsMenuCategory(gift("cakes", "Delicious Valentines Day Cupcakes"), "anniversary-gifts"),
      false
    );
  });

  it("puts hearts, red roses, and valentine sweets on Valentine's", () => {
    assert.equal(
      productFitsMenuCategory(gift("flower-bouquets", "Valentines Day Candy Bouquet"), "valentines-day-gifts"),
      true
    );
    assert.equal(productFitsMenuCategory(gift("cakes", "Delicious Valentines Day Cupcakes"), "valentines-day-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "Red Heart Shaped Cookie Cake"), "valentines-day-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "50 Red Roses"), "valentines-day-gifts"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "Best Dad Tempting Chocolate Cake"), "valentines-day-gifts"), false);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "One Dozen Yellow Roses"), "valentines-day-gifts"), false);
  });

  it("puts festive red, white, and eggnog gifts on Christmas", () => {
    assert.equal(productFitsMenuCategory(gift("flowers", "Festive Floral Garden Premium"), "christmas"), true);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Peaceful Cardinal Bouquet"), "christmas"), true);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "One Dozen White Roses"), "christmas"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "Delicious Eggnog Cheesecake"), "christmas"), true);
    assert.equal(
      productFitsMenuCategory(gift("flowers", "Festive Floral Garden with Birthday Balloon Regular"), "christmas"),
      false
    );
    assert.equal(productFitsMenuCategory(gift("cakes", "Hocus Pocus Cake"), "christmas"), false);
  });

  it("puts champagne, gold, and celebration gifts on New Year", () => {
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Champagne Rose Duo"), "new-year"), true);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Sparkling Rose Luxury Gift Box"), "new-year"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "Petite Midnight Chocolate Cake"), "new-year"), true);
    assert.equal(productFitsMenuCategory(gift("cakes", "Golden Fudge Southern Style Cake"), "new-year"), true);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Be Happy Bouquet Premium"), "new-year"), false);
    assert.equal(
      productFitsMenuCategory(gift("flower-bouquets", "Rose N Lily Celebration with Birthday Balloon Deluxe"), "new-year"),
      false
    );
  });

  it("puts hampers, gift boxes, and wine pairings on Hampers", () => {
    assert.equal(
      productFitsMenuCategory(gift("flower-bouquets", "Elegant Rose Indulgence Hamper"), "gift-hampers"),
      true
    );
    assert.equal(
      productFitsMenuCategory(gift("flowers", "Floral Diyas With Greeting Card And Almonds"), "gift-hampers"),
      true
    );
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Cabernet N Roses Combo"), "gift-hampers"), true);
    assert.equal(
      productFitsMenuCategory(gift("cakes", "Easter Special Assorted Cakes And Chocolates Hamper"), "gift-hampers"),
      true
    );
    assert.equal(productFitsMenuCategory(gift("flowers", "Wine Country Blossoms Regular"), "gift-hampers"), false);
    assert.equal(productFitsMenuCategory(gift("cakes", "Grand Vanilla Cake"), "gift-hampers"), false);
  });

  it("does not match stocked products onto Flowers or unrelated categories", () => {
    assert.equal(productFitsMenuCategory(gift("cakes", "Birthday Strawberry Funfetti Cake"), "flowers"), false);
    assert.equal(productFitsMenuCategory(gift("cakes", "Birthday Strawberry Funfetti Cake"), "plants"), false);
    assert.equal(productFitsMenuCategory(gift("birthday-gifts", "Birthday Strawberry Funfetti Cake"), "birthday-gifts"), false);
  });

  it("leaves an explicit occasion assignment unchanged", () => {
    const assigned = {
      ...gift("flower-bouquets", "Love in Full Bloom"),
      additionalCategorySlugs: ["anniversary-gifts"],
    };
    assert.equal(productFitsMenuCategory(assigned, "valentines-day-gifts"), false);
    assert.equal(productFitsMenuCategory(assigned, "anniversary-gifts"), false);
    assert.equal(productFitsMenuCategory(gift("flower-bouquets", "Love in Full Bloom"), "valentines-day-gifts"), true);
  });
});
