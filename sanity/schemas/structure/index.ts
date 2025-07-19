import type {SchemaDefinition} from "@/sanity/helpers/define-schema";
import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from "sanity/structure";

import config from "@/config";
import {localizedItem} from "@tinloof/sanity-studio";
import {CiFolderOn} from "react-icons/ci";
import {isDev} from "sanity";

import documents from "../documents";

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S) => {
  return S.document().views([S.view.form()]);
};

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Structure")
    .items([
      S.listItem()
        .title("Pages")
        .icon(CiFolderOn)
        .child(
          S.list()
            .title("Pages")
            .items([
              S.documentTypeListItem("home"),
              localizedItem(
                S,
                "modular.page",
                "Modular pages",
                config.i18n.locales,
              ),
              S.divider(),
              S.documentTypeListItem("notFound").title("Not found"),
            ]),
        ),
      S.documentTypeListItem("settings"),
    ]);

const disableCreationDocuments = documents.filter((document) => {
  const schema = document as SchemaDefinition;
  return schema.options?.disableCreation;
});

const disabledSingletons = () => {
  if (!isDev) {
    return [...disableCreationDocuments.map((document) => document.name)];
  }
  return [];
};

export const disableCreationDocumentTypes = [
  // Disable singletons document creation only in production
  ...disabledSingletons(),
  "media.tag",
];
