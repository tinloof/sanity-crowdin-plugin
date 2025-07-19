import type {Metadata} from "next";

import config from "@/config";
import {loadGlobalData} from "@/data/sanity";
import {SanityLive} from "@/data/sanity/live";
import {getOgImages} from "@/data/sanity/resolve-sanity-route-metadata";
import {Inter} from "next/font/google";
import {draftMode} from "next/headers";
import {VisualEditing} from "next-sanity";

import "../globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

type LayoutRouteProps = Promise<{locale: string}>;

export async function generateMetadata({
  params,
}: {
  params: LayoutRouteProps;
}): Promise<Metadata> {
  const {locale} = await params;
  const data = await loadGlobalData({locale, stega: false});
  return {
    openGraph: {
      images: !data?.fallbackOGImage
        ? undefined
        : getOgImages(data.fallbackOGImage),
      title: config.siteName,
    },
    title: config.siteName,
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LayoutRouteProps;
}) {
  const {locale} = await params;

  const draftModeEnabled = (await draftMode()).isEnabled;

  return (
    <html className={sans.variable} lang={locale}>
      <body>
        <div className="flex flex-col bg-white">
          <main className="min-h-svh flex-1">{children}</main>
        </div>
        {draftModeEnabled && <VisualEditing />}
        <SanityLive />
      </body>
    </html>
  );
}
