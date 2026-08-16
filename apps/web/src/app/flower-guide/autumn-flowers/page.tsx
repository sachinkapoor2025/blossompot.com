import type { Metadata } from "next";
import { SeasonGuidePage, seasonMetadata } from "../_components/SeasonGuidePage";

export const metadata: Metadata = seasonMetadata("autumn-flowers");

export default function Page() {
  return <SeasonGuidePage slug="autumn-flowers" />;
}
