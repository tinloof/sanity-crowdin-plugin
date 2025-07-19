import { METADATA_KEY } from "./types";

export const PTD_ID_PREFIX = "crowdin.ptd";

export const ROOT_PATH_STR = "__root";

export const SANITY_API_VERSION = "2024-04-30";

export const TMD_ID_PREFIX = "crowdin.tmd";
export const TMD_TYPE = TMD_ID_PREFIX;

export const NOT_PTD = `${METADATA_KEY}._type != "crowdin.ptd.meta"`;

export const STATIC_DOC_KEYS = ["_id", "_rev", "_type", METADATA_KEY] as const;

// https://github.com/sanity-io/document-internationalization/blob/main/src/constants.ts
export const METADATA_SCHEMA_NAME = `translation.metadata`;
export const TRANSLATIONS_ARRAY_NAME = `translations`;
