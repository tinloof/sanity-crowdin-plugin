import type {
  MultipleMutationResult,
  Path,
  Reference,
  SanityClient,
  SanityDocument,
  WeakReference,
} from "sanity";
import type { PTD_ID_PREFIX, TMD_ID_PREFIX, TMD_TYPE } from "../constants";
import type { getTranslationKey } from "../utils/ids";

export const METADATA_KEY = "crowdinMetadata";

export type LangCode = string;

export type SanityMainDoc = SanityDocument;

export type ExistingReference = {
  _type: string;
  targetLanguageDocId: string | null;
  state: "draft" | "published" | "both";
};

export enum EndpointActionTypes {
  // eslint-disable-next-line no-unused-vars
  REFRESH_PTD = "REFRESH_PTD",
  // eslint-disable-next-line no-unused-vars
  CREATE_TRANSLATIONS = "CREATE_TRANSLATIONS",
  // eslint-disable-next-line no-unused-vars
  GET_PREVIEW_URL = "GET_PREVIEW_URL",
  // eslint-disable-next-line no-unused-vars
  LIST_PROJECTS = "LIST_PROJECTS",
  // eslint-disable-next-line no-unused-vars
  GET_SOURCE_FILE_DATA = "GET_SOURCE_FILE_DATA",
  // eslint-disable-next-line no-unused-vars
  GET_FILE_PROGRESS = "GET_FILE_PROGRESS",
  // eslint-disable-next-line no-unused-vars
  UPDATE_SOURCE_FILE = "UPDATE_SOURCE_FILE",
  // eslint-disable-next-line no-unused-vars
  GET_PROJECT = "GET_PROJECT",
  // eslint-disable-next-line no-unused-vars
  REMOVE_CROWDIN_METADATA = "REMOVE_CROWDIN_METADATA",
}

export interface ReferenceMap {
  [referencedSourceLangDocId: string]:
    | "untranslatable" // for document types that aren't localized
    | "doc-not-found"
    | ExistingReference;
}

export type TMDStatus =
  | "CREATING"
  | "NEW"
  | "COMPLETED"
  | "COMMITTED"
  | "DELETED"
  | "CANCELLED"
  | "FAILED_PERSISTING";

export type TMDTarget = {
  _key: LangCode;
  lang: LangCode;
  ptd: WeakReference;
  targetDoc: Reference;
  /** Cache of resolved references from source to target languages */
  referenceMap?: ReferenceMap;
};

/** For PTDs (Crowdin Translation Documents) only */
export type PtdCrowdinMetadata = {
  _type: "crowdin.ptd.meta";
  sourceDoc: Reference;
  targetDoc: Reference;
  tmd: Reference;
  targetLang: LangCode;
};

export type ParsedTranslationData = Omit<TranslationInput, "diffs"> & {
  diffs: [TranslationDiff, ...TranslationDiff[]];
  /** @see getTranslationKey */
  translationKey: string;
  crowdinFilename: `${ParsedTranslationData["title"]} :: ${ParsedTranslationData["translationKey"]}.json`;
};

export type SanityPTD = SanityDocumentWithCrowdinMetadata & {
  _id: `${typeof PTD_ID_PREFIX}.${LangCode}--${ReturnType<
    typeof getTranslationKey
  >}`;
  corwdinMetadata: PtdCrowdinMetadata;
};

/**
 * **Translation Metadata Document (TMD)**
 *
 * Used for keeping permanent track of data in Crowdin &
 * determining what fields are stale since last translation. */
export type SanityTMD = {
  crowdinDocs: Array<SanityDocumentWithCrowdinMetadata> | null;
  translationsMetadata:
    | (SanityDocument & {
        _type: typeof TMD_TYPE;
        _id: `${typeof TMD_ID_PREFIX}.${ReturnType<typeof getTranslationKey>}`;
        /** Stringified `SanityMainDoc` */
        translations: Array<{
          _key: string;
          _type: string;
          value: SanityDocument;
        }>;
      })
    | null;
};

export type TranslationDiffInsert = {
  path: Path;
  op: "insert";
  /** Applicable only to array items */
  insertAt?: {
    index: number;
    prevKey?: string;
    nextKey?: string;
  };
};
export type TranslationDiffUnset = {
  path: Path;
  op: "unset";
};

export type TranslationDiffSet = {
  path: Path;
  op: "set";
};

export interface TranslationInput {
  sourceDoc: {
    _rev: string;
    _id: string;
    _type: string;
    lang: LangCode;
  };
  diffs?: TranslationDiff[];
  targetLangs: LangCode[];
  /** @see getTranslationTitle */
  title: string;
}

export type TranslationDiff =
  | TranslationDiffInsert
  | TranslationDiffUnset
  | TranslationDiffSet;

/** For PTDs (Crowdin Translation Documents) only */
export type PtdPhraseMetadata = {
  _type: "crowdin.ptd.meta";
  sourceFileId: number;
  sourceDocId: string;
};

export type SanityDocumentWithCrowdinMetadata = SanityDocument & {
  crowdinMetadata?: PtdPhraseMetadata;
  pathname?: {
    current: string;
  };
};

export type SanityTranslationDocPair = {
  lang: LangCode;
  draft?: SanityDocumentWithCrowdinMetadata | null;
  published?: SanityDocumentWithCrowdinMetadata | null;
};

export type DocPairFromAdapter = Omit<SanityTranslationDocPair, "lang"> & {
  lang: LangCode;
};

export type I18nAdapter = {
  refreshPtd: (props: {
    currentDocument: SanityDocumentWithCrowdinMetadata;
    apiEndpoint: string;
  }) => Promise<any>;
  getPreviewUrl: (props: {
    currentDocument: SanityDocumentWithCrowdinMetadata;
    apiEndpoint: string;
  }) => Promise<{
    previewUrl: string;
  }>;
  removeCrowdinMetadata: (props: {
    sanityClient: SanityClient;
    sourceFileId: string;
  }) => Promise<Array<MultipleMutationResult> | undefined>;
  createOrReplacePtd: (props: {
    sanityClient: SanityClient;
    sourceDocId: string;
    translation: any;
    targetLanguageId: LangCode;
  }) => Promise<MultipleMutationResult>;
  updateTargetDocument: (props: {
    sanityClient: SanityClient;
    sourceDocId: string;
    translation: any;
    targetLanguageId: LangCode;
    markAsCompleted?: boolean;
  }) => Promise<MultipleMutationResult>;
  getDocumentLang: (
    document: SanityDocumentWithCrowdinMetadata,
  ) => LangCode | null;
  /**
   * Given the current translation request, fetches the fresh versions of the
   * requested document and target languages.
   *
   * It should return documents for ALL requested languages, so this function should
   * create them if they don't exist.
   */
  getOrCreateTranslatedDocuments: (props: {
    sanityClient: SanityClient;
    sourceDoc: SanityDocumentWithCrowdinMetadata;
    sourceFileId: number;
    targetLangs: LangCode[];
  }) => Promise<DocPairFromAdapter[]>;
};

export type CrowdinPluginOptions = {
  /**
   * The i18n adapter to use for this plugin.
   * It'll be responsible for fetching and modifying documents for each target language.
   *
   * The plugin offers `documentInternationalizationAdapter` for Sanity's `@sanity/document-internationalization` package.
   */
  i18nAdapter: I18nAdapter;
  /**
   * Schema types the plugin can translate
   *
   * @example
   * translatableTypes: ['post', 'page', 'lesson'] // etc.
   */
  translatableTypes: readonly string[];
  /**
   * Language code of all languages users can translate to.
   * Should be the same as the one stored in your Sanity documents and used by your front-end.
   *
   * @example
   * supportedTargetLanguages: ['en', 'es', 'fr', 'pt', 'cz']
   */
  supportedTargetLangs: readonly string[];
  /**
   * Language code of the source language that will be translated.
   * Should be the same as the one stored in your Sanity documents and used by your front-end.
   *
   * @example
   * sourceLanguage: 'en'
   */
  sourceLang: string;
  /**
   * The URL to your configured plugin backend API.
   *
   * @example
   * backendEndpoint: 'https://my-front-end.com/api/sanity-crowdin'
   */
  apiEndpoint: string;
};
