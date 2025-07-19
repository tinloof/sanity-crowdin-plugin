import { uuid } from "@sanity/uuid";
import {
  METADATA_SCHEMA_NAME,
  PTD_ID_PREFIX,
  TRANSLATIONS_ARRAY_NAME,
} from "../constants";
import type { DocPairFromAdapter, I18nAdapter, LangCode } from "../types";
import { EndpointActionTypes } from "../types";
import { draftId, getPtdId, isDraft, undraftId } from "../utils/ids";
import type { TranslationReference } from "@sanity/document-internationalization";
import { parser } from "../backend/createTranslations";
import type { MultipleMutationResult, SanityDocument } from "next-sanity";

export function documentInternationalizationAdapter({
  languageField = "locale",
  pathnameField = "slug",
}: {
  languageField?: string;
  weakReferences?: boolean;
  pathnameField?: string;
} = {}): I18nAdapter {
  return {
    refreshPtd: async (props) => {
      const { apiEndpoint, currentDocument } = props;
      const doc = currentDocument as any;

      try {
        const body = {
          action: EndpointActionTypes.REFRESH_PTD,
          sourceFileId: doc.crowdinMetadata.sourceFileId,
          sourceDocId: doc.crowdinMetadata.sourceDocId,
          targetLanguage: doc[languageField],
        };

        const res = await fetch(apiEndpoint, {
          body: JSON.stringify(body),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        return await res.json();
      } catch (err) {
        console.error(err);
        throw new Error("Failed to fetch preview url");
      }
    },
    getPreviewUrl: async (props) => {
      const { apiEndpoint, currentDocument } = props;
      const doc = currentDocument as any;
      try {
        const body = {
          action: EndpointActionTypes.GET_PREVIEW_URL,
          pathname: doc[pathnameField].current,
          targetLanguage: doc[languageField],
          docType: doc._type,
          sourceDocId: doc.crowdinMetadata.sourceDocId,
        };

        const res = await fetch(apiEndpoint, {
          body: JSON.stringify(body),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        return await res.json();
      } catch (err) {
        console.error(err);
        throw new Error("Failed to fetch preview url");
      }
    },
    removeCrowdinMetadata: async (props) => {
      const { sanityClient, sourceFileId } = props;

      const query = /* groq */ `*[crowdinMetadata.sourceFileId == $sourceFileId][]{...}`;

      try {
        const documents = await sanityClient.fetch<Array<SanityDocument>>(
          query,
          {
            sourceFileId: parseInt(sourceFileId),
          },
        );

        if (!documents || !documents.length) {
          console.warn(
            `No documents found in Sanity withcrowdinMetadata.sourceFileId: ${sourceFileId}`,
          );
        }

        const updatedDocuments: Array<MultipleMutationResult> = [];

        for (const document of documents) {
          if (!document.crowdinMetadata) continue;

          // Delete the PTD documents
          if (document._id.includes(PTD_ID_PREFIX)) {
            await sanityClient.delete(document._id);
          }
          // Delete the Crowdin metadata
          else {
            const keysPatch = sanityClient
              .patch(document._id)
              .unset(["crowdinMetadata"]);

            const updatedDoc = await sanityClient
              .transaction()
              .patch(keysPatch)
              .commit({
                visibility: "async",
              });

            updatedDocuments.push(updatedDoc);
          }
        }

        return updatedDocuments;
      } catch (err) {
        console.error(err);
        throw new Error("Failed to remove Crowdin metadata");
      }
    },
    createOrReplacePtd: async (props) => {
      const { sanityClient, sourceDocId, translation, targetLanguageId } =
        props;

      try {
        const id = getPtdId({ targetLanguageId, sourceDocId });
        const translationJson = parser.htmlToJson(translation);
        const keysPatch = sanityClient.patch(id).set({
          ...translationJson,
          _id: id,
          [pathnameField]: {
            current: translationJson[pathnameField].current + "-preview",
          },
          [languageField]: targetLanguageId.toLocaleLowerCase(),
        });

        const sanityTargetDocument = await sanityClient
          .transaction()
          .createOrReplace({
            _id: id,
            _type: translationJson._type,
          })
          .patch(keysPatch)
          .commit({
            visibility: "async",
          });

        return sanityTargetDocument;
      } catch (err) {
        console.error(err);
        throw new Error("Failed to createOrReplace PTD");
      }
    },
    updateTargetDocument: async (props) => {
      const { sanityClient, sourceDocId, translation, targetLanguageId, markAsCompleted = false } =
        props;
      const query = `*[crowdinMetadata.sourceDocId == $docId && _id != $docId && ${languageField} == $lang]`;
      try {
        const result = await sanityClient.fetch(query, {
          docId: sourceDocId,
          lang: targetLanguageId.toLocaleLowerCase(),
        });

        if (!result) {
          throw new Error("Failed to fetch target document");
        }

        const sanityTargetDocument = result?.filter(
          (doc: SanityDocument) => !doc._id.includes(PTD_ID_PREFIX),
        )[0];
        const ptd = result?.filter((doc: SanityDocument) =>
          doc._id.includes(PTD_ID_PREFIX),
        )[0];

        if (!sanityTargetDocument._id) {
          throw new Error("Failed to fetch target document");
        }

        const transaction = sanityClient.transaction();

        const translationJson = parser.htmlToJson(translation);
        const keysPatch = sanityClient
          .patch(sanityTargetDocument._id)
          .set({
            ...sanityTargetDocument,
            ...translationJson,
            _id: sanityTargetDocument._id,
            [languageField]: targetLanguageId.toLocaleLowerCase(),
          });

        if (markAsCompleted) {
          keysPatch.unset(["crowdinMetadata"]);
        }

        transaction
          .createOrReplace({
            _id: sanityTargetDocument._id,
            _type: sanityTargetDocument._type,
          })
          .patch(keysPatch);

        if (ptd?._id) {
          transaction.delete(ptd._id);
        }

        const commit = await transaction.commit({
          visibility: "async",
        });

        return commit;
      } catch (err) {
        console.error(err);
        throw new Error("Failed to fetch target document");
      }
    },
    getDocumentLang: (document) =>
      (document?.[languageField] as LangCode) || null,
    getOrCreateTranslatedDocuments: async (props) => {
      const { sanityClient, sourceDoc } = props;
      const sourceDocLang = sourceDoc[languageField] as LangCode;
      const query = /* groq */ `
      coalesce(
        // For documents with translations, fetch the translations metadata
        *[_type == $metadataType && references($publishedId)][0] {
          _id,
          _type,
          "translations": ${TRANSLATIONS_ARRAY_NAME}[] {
            "lang": _key,
            "published": value->,
            "draft": *[_id == ("drafts." + ^.value._ref)][0],
          }
        },
        // Otherwise, fetch the document itself and handle its draft & published states
        *[_id == $publishedId][0]{
          "lang": ${languageField},
          "published": @,
          "draft": *[_id == $draftId][0],
        },
        *[_id == $draftId][0]{
          "lang": ${languageField},
          "published": null,
          "draft": @,
        },
      )`;
      const fetched = await sanityClient.fetch<
        | {
            _id: string;
            _type: typeof METADATA_SCHEMA_NAME;
            translations: DocPairFromAdapter[];
          }
        | DocPairFromAdapter
      >(query, {
        publishedId: undraftId(sourceDoc._id),
        draftId: draftId(sourceDoc._id),
        metadataType: METADATA_SCHEMA_NAME,
      });

      if (!fetched) throw new Error("Failed fetching fresh documents");

      const metaDocument =
        "_type" in fetched && fetched._type === "translation.metadata"
          ? fetched
          : undefined;
      const allInitialDocuments = metaDocument
        ? metaDocument.translations
            // As translations in meta document are weak references, they might be null
            .filter((t) => !!(t.draft || t.published)?._id)
        : [fetched as DocPairFromAdapter];

      const freshSourcePair = allInitialDocuments.find(
        (doc) => doc.lang === sourceDocLang,
      );

      const freshDocToCopy = isDraft(sourceDoc._id)
        ? freshSourcePair?.draft || freshSourcePair?.published
        : freshSourcePair?.published || freshSourcePair?.draft;

      if (!freshDocToCopy) {
        throw new Error("Failed fetching fresh source document");
      }

      const crowdinMetadata = {
        sourceFileId: props.sourceFileId,
        sourceDocId: undraftId(sourceDoc._id),
        _type: "crowdin.ptd.meta" as const,
      };

      const langsMissingTranslation = props.targetLangs.flatMap((lang) => {
        if (
          allInitialDocuments.some(
            (doc) => doc.lang === lang && !!(doc.draft || doc.published)?._id,
          )
        ) {
          return [];
        }

        const publishedId = uuid();
        return {
          lang,
          publishedId,
          doc: {
            ...freshDocToCopy,
            crowdinMetadata,
            _id: draftId(publishedId),
            [languageField]: lang.toLocaleLowerCase(),
          },
        };
      });

      if (!langsMissingTranslation.length) {
        return allInitialDocuments;
      }

      const transaction = props.sanityClient.transaction();

      /**
       * Creates the translated documents for the missing languages
       * @see `handleCreate` at https://github.com/sanity-io/document-internationalization/blob/main/src/components/LanguageOption.tsx#L59
       */
      langsMissingTranslation.forEach(({ doc }) => {
        transaction.create(doc);
      });

      const sourceReference = createTranslationReference(
        sourceDocLang.toLocaleLowerCase(),
        sourceDoc._id,
        sourceDoc._type,
      );
      const newTranslationsReferences = langsMissingTranslation.map((t) =>
        createTranslationReference(t.lang, t.publishedId, sourceDoc._type),
      );

      /**
       * Associates the new translations with the source document via the meta document
       * @see `handleCreate` at https://github.com/sanity-io/document-internationalization/blob/main/src/components/LanguageOption.tsx#L98
       */
      if (metaDocument) {
        transaction.patch(metaDocument._id, (patch) =>
          patch
            // First make sure we remove previous translations in the metadata document to prevent duplication
            .unset(
              newTranslationsReferences.map(
                (ref) => `translations[_key == "${ref._key}"]`,
              ),
            )
            .insert("after", "translations[-1]", newTranslationsReferences),
        );
      } else {
        transaction.create({
          _id: uuid(),
          _type: METADATA_SCHEMA_NAME,
          [TRANSLATIONS_ARRAY_NAME]: [
            sourceReference,
            ...newTranslationsReferences,
          ],
          schemaTypes: [sourceDoc._type],
        });
      }

      // Patch the source document with the new metadata
      transaction.patch(sourceDoc._id, (patch) =>
        patch.set({
          crowdinMetadata,
        }),
      );

      const result = await transaction.commit({ returnDocuments: true });

      const finalDocuments: DocPairFromAdapter[] = [
        ...allInitialDocuments,
        ...langsMissingTranslation.map(({ doc, lang }) => {
          // Find the `_rev` from the resulting document so we can use it to
          // lock documents safely with `ifRevisionId` in `lockDocuments`.
          const _rev =
            result.find((d) => d._id === doc._id)?._rev ||
            // If no _rev found, don't use `ifRevisionId`
            (null as unknown as string);
          return {
            lang: lang,
            draft: { ...doc, _rev },
            published: null,
          };
        }),
      ];

      return finalDocuments;
    },
  };
}

/**
 * Adapted from https://github.com/sanity-io/document-internationalization/blob/main/src/utils/createReference.ts
 */
function createTranslationReference(
  key: string,
  ref: string,
  type: string,
): TranslationReference {
  return {
    _key: key.toLocaleLowerCase(),
    _type: "internationalizedArrayReferenceValue",
    value: {
      _type: "reference",
      _ref: undraftId(ref),
      _weak: true,
      _strengthenOnPublish: { type },
    },
  };
}
