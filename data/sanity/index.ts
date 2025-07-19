import type {PageProps} from "@/types";

import config from "@/config";
import {draftMode} from "next/headers";
import "server-only";

import {sanityFetch} from "./live";
import {
  GLOBAL_QUERY,
  HOME_QUERY,
  MODULAR_PAGE_QUERY,
  NOT_FOUND_QUERY,
  REDIRECT_QUERY,
  ROUTE_QUERY,
  STATIC_PATHS_QUERY,
} from "./queries";

export type DraftParams = {
  ignoreDraftMode?: boolean;
  stega?: boolean;
};

async function getDraftParams({
  ignoreDraftMode = false,
  stega = true,
}: DraftParams) {
  const isDraftMode = ignoreDraftMode ? false : (await draftMode()).isEnabled;
  const token = config.sanity.token;

  if (isDraftMode && !token) {
    throw new Error(
      "The `SANITY_API_READ_TOKEN` environment variable is required in Draft Mode.",
    );
  }
  const perspective = isDraftMode ? "previewDrafts" : "published";

  return {
    perspective,
    // Allow stega to be overridden by the caller, in cases like the meta data
    // where we want to show the published data in draft mode
    stega: isDraftMode && stega,
  };
}

export async function loadRoute({
  pathname,
  ...draftParams
}: {pathname: string} & DraftParams) {
  const {data} = await sanityFetch({
    params: {pathname},
    query: ROUTE_QUERY,
    ...(await getDraftParams(draftParams)),
  });
  return data;
}

export async function loadModularPage({
  locale,
  pathname,
  ...draftParams
}: {
  locale: string;
  pathname: string;
} & DraftParams) {
  const {data} = await sanityFetch({
    params: {locale, pathname},
    query: MODULAR_PAGE_QUERY,
    ...(await getDraftParams(draftParams)),
  });
  return data;
}

export async function loadGlobalData({
  locale,
  ...draftParams
}: {locale: string} & DraftParams) {
  const {data} = await sanityFetch({
    params: {locale},
    query: GLOBAL_QUERY,
    ...(await getDraftParams(draftParams)),
  });
  return data;
}

export async function loadPageByPathname({
  params,
  ...draftParams
}: {
  params: PageProps<"...path" | "locale", any>["params"];
} & DraftParams) {
  const {locale, path} = await params;
  let pathname: string;

  if (Array.isArray(path)) {
    pathname = "/" + path.join("/");
  } else {
    pathname = "/" + path;
  }

  const data = await loadRoute({pathname, ...draftParams});
  const documentType = data?.routeData._type;

  switch (documentType) {
    case "modular.page":
      return loadModularPage({locale, pathname, ...draftParams});
    default:
      console.warn("Invalid document type:", documentType);
      return null;
  }
}

export async function loadHome({
  locale,
  ...draftParams
}: {locale: string} & DraftParams) {
  const {data} = await sanityFetch({
    params: {locale},
    query: HOME_QUERY,
    ...(await getDraftParams(draftParams)),
  });
  return data;
}

export async function loadRedirects(paths: string[]) {
  const {data} = await sanityFetch({
    params: {paths},
    query: REDIRECT_QUERY,
    perspective: "published",
    stega: false,
  });
  return data;
}

export async function loadStaticPaths() {
  const {data} = await sanityFetch({
    query: STATIC_PATHS_QUERY,
    perspective: "published",
    stega: false,
  });
  return data;
}

export async function loadNotFound({
  locale,
  ...draftParams
}: {locale: string} & DraftParams) {
  const {data} = await sanityFetch({
    params: {locale},
    query: NOT_FOUND_QUERY,
    ...(await getDraftParams(draftParams)),
  });
  return data;
}
