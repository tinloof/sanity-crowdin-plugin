import config from "@/config";
import { i18nAdapter, supportedTargetLangs } from "@/sanity/crowdinConfig";

import { createInternalHandler } from "@/sanity/plugins/crowdin-sanity/backendHandler";
import { createClient } from "@sanity/client";

const client = createClient({
  ...config.sanity,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2023-06-21",
  useCdn: false,
});

const crowdinProjectId =
  typeof process.env.CROWDIN_PROJECT_ID !== "undefined"
    ? parseInt(process.env.CROWDIN_PROJECT_ID)
    : 0;

const crowdinHandler = createInternalHandler({
  crowdinCredentials: {
    accessToken: process.env.CROWDIN_ACCESS_TOKEN || "",
    projectId: crowdinProjectId,
    organization: process.env.CROWDIN_ORGANIZATION || "",
  },
  sanityClient: client.withConfig({ token: process.env.SANITY_API_TOKEN }),
  i18nAdapter,
  supportedTargetLangs,
});

export const POST = async (request: Request) => {
  const body = await request.json();
  const crowdinRes = await crowdinHandler({ body, requestUrl: request.url });

  if (!crowdinRes) {
    return new Response("Syncing failed", { status: 500 });
  }

  return new Response(JSON.stringify(crowdinRes.body), {
    status: crowdinRes.status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const OPTIONS = async () => {
  return new Response("", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
