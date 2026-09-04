import { redirect } from "next/navigation";

/** GBO API lives under Vendor Management → GBO API. */
export default function AdminGboApiRedirectPage() {
  redirect("/admin/vendor-management?tab=gbo");
}
