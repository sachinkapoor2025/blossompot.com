export const WISHLIST_PATH = "/wishlist";

export function wishlistEntryHref(isSignedIn: boolean): string {
  return isSignedIn ? WISHLIST_PATH : `/account?redirect=${encodeURIComponent(WISHLIST_PATH)}`;
}
