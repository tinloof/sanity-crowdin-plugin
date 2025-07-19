"use client";

import { definePlugin } from "sanity";

import { injectCrowdinIntoSchema } from "./injectCrowdinIntoSchema";

import type { CrowdinPluginOptions } from "./types";
import { PTD_ID_PREFIX as TEMPORARY_DOCUMENT_TYPE } from "./constants";

export { TEMPORARY_DOCUMENT_TYPE };

/**
 *
 */
export const crowdinPlugin = definePlugin<CrowdinPluginOptions>(
  (pluginOptions) => {
    return {
      name: "sanity-plugin-crowdin",
      schema: {
        types: (prev) => injectCrowdinIntoSchema(prev, pluginOptions),
      },
    };
  },
);
