import { PTD_ID_PREFIX, TMD_ID_PREFIX } from "../constants";
import type { LangCode, TranslationDiff, TranslationInput } from "../types";

import { pathToString } from "./paths";
import JsSHA from "jssha";

/**
 * Ensures a given string is suitable to serve as a document's _id or an array item's _key in Sanity.
 */
export function makeKeyAndIdFriendly(str: string) {
  return (
    str
      // Remove all characters that aren't letters, numbers, or periods
      ?.replace(/[^\d\w.]/g, "_")
      // Remove repeated underscores
      .replace(/_{2,}/, "_") || ""
  );
}

/** Used as an id and _key for the translation. */
export function getTranslationKey({
  _id,
  _rev,
  diffs,
  targetLangs,
}: {
  _id: string;
  _rev: string;
  diffs: TranslationDiff[];
  targetLangs: TranslationInput["targetLangs"];
}) {
  const templatedId = [
    ...diffs.map(({ path }) => pathToString(path)),
    ...targetLangs.map((lang) => lang),
    _id.replace(".", "_"),
    _rev,
  ]
    .map(makeKeyAndIdFriendly)
    .join("__");

  const sha = new JsSHA("SHA-256", "TEXT", { encoding: "UTF8" });
  sha.update(templatedId);
  // Never gets parsed back to its contents.
  return sha.getHash("HEX").slice(0, 8);
}
export function undraftId(id: string) {
  return id.replace("drafts.", "");
}

export function draftId(id: string) {
  return `drafts.${undraftId(id)}`;
}

export function isDraft(id: string) {
  return undraftId(id) !== id;
}

export function getPtdId({
  targetLanguageId,
  sourceDocId,
}: {
  sourceDocId: string;
  targetLanguageId: LangCode;
}): string {
  return `${PTD_ID_PREFIX}-${targetLanguageId.toLocaleLowerCase()}-${sourceDocId}`;
}

export function getTmdId(translationKey: string) {
  return `${TMD_ID_PREFIX}.${translationKey}`;
}

export function isPtdId(id: string) {
  return undraftId(id).startsWith(PTD_ID_PREFIX);
}

export function getIdFromSourceFileName(filename: string) {
  const [, docId = ""] = filename.split("--");
  return docId.replace(".html", "");
}
