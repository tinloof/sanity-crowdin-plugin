import type { DocumentStore } from "sanity";
import type { SanityTMD } from "../types";
import { createHookFromObservableFactory } from "sanity";
import { SANITY_API_VERSION, METADATA_SCHEMA_NAME } from "../constants";
import { draftId, undraftId } from "../utils/ids";

export const useTMDs = createHookFromObservableFactory<
  // Pick<SanityMainDoc, '_id' | '_type' | '_rev' | 'phraseMetadata'>[],
  SanityTMD,
  {
    documentStore: DocumentStore;
    docId: string;
    docType: string;
  }
>(({ documentStore, docId, docType }) => {
  return documentStore.listenQuery(
    /* groq */ `{
      "crowdinDocs": *[
        _type == $type &&
        crowdinMetadata.sourceDocId in $ids
        && !(_id in $ids)
      ],
      "translationsMetadata": *[
        _type == "${METADATA_SCHEMA_NAME}" &&
        references($ids)
      ][0]
    }`,
    { ids: [undraftId(docId), draftId(docId)], type: docType },
    {
      apiVersion: SANITY_API_VERSION,
    },
  );
});
