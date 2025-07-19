import type {BaseSchemaDefinition, SchemaTypeDefinition} from "sanity";

import StudioLogo from "@/components/studio-logo";
import config from "@/config";
import {visionTool} from "@sanity/vision";
import {documentI18n, pages} from "@tinloof/sanity-studio";
import {defineConfig, isDev} from "sanity";
import {structureTool} from "sanity/structure";
import {media, mediaAssetSource} from "sanity-plugin-media";

import schemas from "./sanity/schemas";
import {
  defaultDocumentNode,
  disableCreationDocumentTypes,
  structure,
} from "./sanity/schemas/structure";
import { crowdinPlugin } from "./sanity/plugins/crowdin-sanity";
import { supportedTargetLangs, i18nAdapter } from "./sanity/crowdinConfig";
import defineCrowdinOptions from "./sanity/plugins/crowdin-sanity/defineCrowdinPlugin";
import { injectCrowdinIntoSchema } from "./sanity/plugins/crowdin-sanity/injectCrowdinIntoSchema";

// Extracts the schema types that have a locale field
function extractTranslatableSchemaTypes(schemas: BaseSchemaDefinition[]) {
 return schemas
   .filter((schema: any) =>
     schema?.fields?.find((field: any) => field.name === "locale"),
   )
   .map((schema: any) => schema.name);
}

const CROWDIN_CONFIG = defineCrowdinOptions({
 sourceLang: config.i18n.defaultLocaleId,
 supportedTargetLangs,
 translatableTypes: extractTranslatableSchemaTypes(schemas),
 apiEndpoint:
   typeof process.env.NEXT_PUBLIC_CROWDIN_API_ENDPOINT !== "undefined"
     ? process.env.NEXT_PUBLIC_CROWDIN_API_ENDPOINT
     : "http://localhost:3000/api/crowdin-sync",
 i18nAdapter,
});


export default defineConfig({
  basePath: config.sanity.studioUrl,
  dataset: config.sanity.dataset,
  icon: StudioLogo,
  plugins: [
    pages({
      creatablePages: ["modular.page", "blog.post"],
      previewUrl: {
        previewMode: {
          enable: "/api/draft",
        },
      },
    }),
    documentI18n({...config.i18n, schemas}),
    crowdinPlugin(CROWDIN_CONFIG),
    structureTool({
      defaultDocumentNode,
      structure,
      title: "General",
    }),
    media(),
    visionTool({defaultApiVersion: config.sanity.apiVersion}),
  ],
  projectId: config.sanity.projectId,
  schema: {
    templates: (templates) =>
      templates?.filter(
        (template) =>
          !disableCreationDocumentTypes?.includes(template.schemaType),
      ),
    types: injectCrowdinIntoSchema(schemas as SchemaTypeDefinition[], CROWDIN_CONFIG),
  },
  title: config.siteName,
  form: {
    file: {
      assetSources: (prev) => {
        return prev.filter((assetSource) => assetSource === mediaAssetSource);
      },
    },
    image: {
      assetSources: (prev) => {
        return prev.filter((assetSource) => assetSource === mediaAssetSource);
      },
    },
  },
});
