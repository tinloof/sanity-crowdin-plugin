import type {PageProps} from "@/types";
import type {ResolvingMetadata} from "next";

import ModularPage from "@/components/templates/page/modular-page";
import config from "@/config";
import {loadPageByPathname, loadStaticPaths} from "@/data/sanity";
import {resolveSanityRouteMetadata} from "@/data/sanity/resolve-sanity-route-metadata";
import {notFound} from "next/navigation";

export type DynamicRouteProps = PageProps<"...path" | "locale", any>;

export async function generateMetadata(
  {params}: DynamicRouteProps,
  parent: ResolvingMetadata,
) {
  const initialData = await loadPageByPathname({params, stega: false});

  if (!initialData) {
    return notFound();
  }

  if (["modular.page"].includes(initialData._type)) {
    return resolveSanityRouteMetadata(initialData, parent);
  }

  return {};
}

export async function generateStaticParams() {
  const data = await loadStaticPaths();

  if (!data) return [];

  const staticPaths =
    data
      ?.map((page) => {
        const path = page.pathname?.split("/");
        return {
          locale: page?.locale ?? config.i18n.defaultLocaleId,
          path: path?.filter((str) => str !== ""),
        };
      })
      .filter(({path}) => (path?.length || 0) > 0) || [];

  return staticPaths;
}

export default async function DynamicRoute({params}: DynamicRouteProps) {
  const initialData = await loadPageByPathname({params});

  if (!initialData) return notFound();

  switch (initialData._type) {
    case "modular.page":
      return <ModularPage data={initialData} />;
    default:
      return <div>Template not found</div>;
  }
}
