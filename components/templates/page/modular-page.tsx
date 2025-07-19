import type {
  HOME_QUERYResult,
  MODULAR_PAGE_QUERYResult,
} from "@/types/sanity.generated";

import SectionsRenderer from "@/components/sections/section-renderer";
import {notFound} from "next/navigation";

export default function ModularPage({
  data,
}: {
  data: HOME_QUERYResult | MODULAR_PAGE_QUERYResult;
}) {
  if (data?._type !== "modular.page" && data?._type !== "home")
    return notFound();

  return <SectionsRenderer fieldName="body" sections={data.sections} />;
}
