import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** GBO catalog now lives on the homepage. Keep this path as a bookmark. */
export default function OverseasGiftsRedirect() {
  redirect("/");
}
