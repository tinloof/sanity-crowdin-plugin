import type {
  SanityDocumentWithCrowdinMetadata,
  SanityMainDoc,
  SanityPTD,
} from "../types";
import { isPtdId, undraftId } from "./ids";

export function isPTDDoc(
  doc: SanityDocumentWithCrowdinMetadata
): doc is SanityPTD {
  return isPtdId(doc._id) && doc.crowdinMetadata?._type === "crowdin.ptd.meta";
}

export function isMainDoc(
  doc: SanityDocumentWithCrowdinMetadata
): doc is SanityMainDoc {
  if (doc?.crowdinMetadata?.sourceFileId) {
    return undraftId(doc._id) === undraftId(doc.crowdinMetadata.sourceDocId);
  }

  if (!doc?.crowdinMetadata?.sourceFileId) {
    return true;
  }

  return false;
}
