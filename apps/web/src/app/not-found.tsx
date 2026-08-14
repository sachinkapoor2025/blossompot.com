import { redirect } from "next/navigation";

/** Send unknown pages to home so old inbound links are not lost on a dead end. */
export default function NotFound() {
  redirect("/");
}
