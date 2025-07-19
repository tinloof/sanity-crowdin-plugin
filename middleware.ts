import type {NextRequest} from "next/server";

import {stegaClean} from "@sanity/client/stega";
import {NextResponse} from "next/server";

import appConfig from "./config";
import getRedirect from "./data/sanity/redirects";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  /**
   * Redirections
   */
  const redirect = (await getRedirect(pathname)) as any;
  const cleanRedirect = stegaClean(redirect);

  if (cleanRedirect) {
    return NextResponse.redirect(
      new URL(cleanRedirect.destination, request.url),
      {
        status: cleanRedirect.permanent ? 301 : 302,
      },
    );
  }

  /**
   * Internationalization
   */
  const pathnameIsMissingLocale = appConfig.i18n.locales.every(
    (locale) =>
      // Check if there is any supported locale in the pathname
      !pathname.startsWith(`/${locale.id}/`) && pathname !== `/${locale.id}`,
  );
  if (pathnameIsMissingLocale) {
    const searchString = searchParams.toString();
    return NextResponse.rewrite(
      new URL(
        `/${appConfig.i18n.defaultLocaleId}${pathname}${
          searchString ? `?${searchString}` : ""
        }`,
        request.url,
      ),
    );
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manage|blocks|cms|favicons|fonts|images|sections|studio-docs|sitemap\\.xml).*)",
  ],
};