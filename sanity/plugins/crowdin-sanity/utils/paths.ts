import type { Path } from "sanity";
import { toString } from "@sanity/util/paths";

import type { TranslationDiff } from "../types";
import { ROOT_PATH_STR } from "../constants";

export const FULL_DOC_DIFF_PATH: TranslationDiff = {
  op: "set",
  path: [],
};

export function pathToString(path: Path) {
  if (path.length === 0) return ROOT_PATH_STR;

  return toString(path);
}
