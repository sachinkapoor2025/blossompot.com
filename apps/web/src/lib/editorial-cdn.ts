import { cdnUploadUrl } from "@blossompot/shared";

export function editorialCdnUrl(filename: string): string {
  return cdnUploadUrl(`editorial/${filename.replace(/^\/+/, "")}`);
}
