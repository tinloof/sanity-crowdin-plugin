import type { SchemaTypeDefinition } from "sanity";
import { defineField, defineType } from "sanity";

import type { CrowdinPluginOptions } from "./types";
import { isPtdId, undraftId } from "./utils/ids";
import getCrowdinDocDashboard from "./components/CrowdinDocDashboard";

export function injectCrowdinIntoSchema(
  types: SchemaTypeDefinition[],
  pluginOptions: CrowdinPluginOptions,
) {
  return types.map((type) => injectSchema(type, pluginOptions));
}

function injectSchema(
  schemaType: SchemaTypeDefinition,
  pluginOptions: CrowdinPluginOptions,
) {
  if (
    !pluginOptions.translatableTypes.includes(schemaType.name) ||
    !("fields" in schemaType) ||
    !Array.isArray(schemaType.fields)
  ) {
    return schemaType;
  }

  const crowdinMetadata = defineField({
    name: "crowdinMetadata",
    title: "here",
    type: "object",
    components: {
      field: getCrowdinDocDashboard(pluginOptions),
    },
    readOnly: true,
    fields: [
      defineField({
        name: "fakefield",
        type: "string",
      }),
    ],
  });

  return defineType({
    ...schemaType,
    readOnly: (context) => {
      const document = context.document as any;
      if (
        context.document?._id &&
        undraftId(context.document?._id) &&
        isPtdId(context.document._id)
      ) {
        return true;
      }

      if (
        document &&
        document?.crowdinMetadata?.sourceDocId &&
        context.document?._id &&
        undraftId(document?.crowdinMetadata?.sourceDocId) !==
          undraftId(context.document?._id)
      ) {
        return true;
      }

      if (typeof schemaType.readOnly === "function") {
        return schemaType.readOnly(context);
      }

      if (typeof schemaType.readOnly === "boolean") {
        return schemaType.readOnly;
      }

      return false;
    },
    fields: [crowdinMetadata, ...schemaType.fields],
  });
}
