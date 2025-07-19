import type {
  PatchRequest,
  SourceFiles,
  SourceFilesModel,
  SourceStrings,
  UploadStorage,
} from "@crowdin/crowdin-api-client";
import crowdin from "@crowdin/crowdin-api-client";
import type { BackendHandlerRawInput } from "../backendHandler";
import type {
  EndpointActionTypes,
  I18nAdapter,
  LangCode,
  SanityDocumentWithCrowdinMetadata,
} from "../types";
import { formatLangsForCrowdin } from "../utils/langs";
import { SanityHTMLParser } from "../utils/parser";
import { uuid } from "@sanity/uuid";
import { buildPreviewUrl } from "../utils/previewUrl";
import { fieldsToExcludeFromTranslation } from "../../../fieldsToExcludeFromTranslation";

export const parser = new SanityHTMLParser(
  fieldsToExcludeFromTranslation.strings || [],
  fieldsToExcludeFromTranslation.objects || [],
);

export type CreateMultipleTranslationsInput = {
  currentDocument: SanityDocumentWithCrowdinMetadata;
  sourceFileTitle: string;
  translations: LangCode[];
  action: EndpointActionTypes.CREATE_TRANSLATIONS;
};

export async function createMultipleTranslations({
  body,
  requestUrl,
  rawInput,
}: {
  body: CreateMultipleTranslationsInput;
  rawInput: BackendHandlerRawInput;
  requestUrl: string;
}) {
  const projectId = rawInput.crowdinCredentials.projectId;
  const { uploadStorageApi, sourceFilesApi } = new crowdin({
    token: rawInput.crowdinCredentials.accessToken || "",
    organization: rawInput.crowdinCredentials.organization,
  });
  const supportedTargetLangs = rawInput.supportedTargetLangs;
  const excludedTargetLanguages = supportedTargetLangs.filter(
    (lang) => !body.translations.includes(lang),
  );
  const i18nAdapter = rawInput.i18nAdapter;

  // #2 Create storage
  const storage = await addCrowdinStorage({
    uploadStorageApi,
    fileData: parser.jsonToHtml(body.currentDocument),
    fileName: body.currentDocument._id,
  });

  // #3 Get Directory ID
  const directoryId = await getDirectoryId({
    projectId,
    directoryType: body.currentDocument._type,
    sourceFilesApi,
  });

  // #4 Create source file
  const file = await createCrowdinSourceFile({
    sourceFilesApi,
    directoryId,
    projectId,
    storageId: storage.data.id,
    sourceFileName: `${uuid()}--${storage.data.fileName}.html`,
    sourceFileTitle: body.sourceFileTitle,
    excludedTargetLanguages: formatLangsForCrowdin(excludedTargetLanguages),
    currentDocument: body.currentDocument,
    origin: new URL(requestUrl).origin,
    supportedTargetLangs,
  });

  // #5 Get fresh content & ensure translated documents are there
  await getOrCreateTranslatedDocuments({
    body,
    sourceFileId: file.data.id,
    rawInput,
    i18nAdapter,
  });

  return {
    status: 200,
    body: {
      code: "AllTranslationsCreated",
      message: "All translations created",
      sourceFileId: file.data.id,
    },
  };
}

export async function createCrowdinSourceFile({
  sourceFilesApi,
  projectId,
  directoryId,
  storageId,
  sourceFileName,
  sourceFileTitle,
  excludedTargetLanguages,
  currentDocument,
  origin,
  supportedTargetLangs,
}: {
  sourceFilesApi: SourceFiles;
  projectId: number;
  directoryId?: number | null;
  storageId: number;
  sourceFileName: string;
  sourceFileTitle: string;
  excludedTargetLanguages: string[];
  currentDocument: SanityDocumentWithCrowdinMetadata;
  origin: string;
  supportedTargetLangs: readonly string[];
}) {
  function getPreviewContext() {
    return supportedTargetLangs
      .map((lang) => {
        return `
          Preview link - ${lang.toUpperCase()}\n\n${buildPreviewUrl({
            origin,
            targetLang: lang,
            documentType: currentDocument._type,
            sourceDocId: currentDocument._id,
            pathname: currentDocument.pathname?.current,
          })}
        `.trim();
      })
      .join("\n\n--------------------\n\n");
  }

  try {
    const fileData: SourceFilesModel.CreateFileRequest = {
      name: sourceFileName,
      title: sourceFileTitle,
      storageId,
      excludedTargetLanguages: formatLangsForCrowdin(excludedTargetLanguages),
      type: "html",
      context: getPreviewContext(),
    };

    if (directoryId) {
      fileData.directoryId = directoryId;
    }

    const file = await sourceFilesApi.createFile(projectId, fileData);

    return file;
  } catch (e) {
    console.error(e);
    throw new Error(
      "[sanity-plugin-crowdin/backend] Failed to create source file",
    );
  }
}

export async function getDirectoryId({
  sourceFilesApi,
  projectId,
  directoryType,
}: {
  projectId: number;
  directoryType: string;
  sourceFilesApi: SourceFiles;
}) {
  const DIRECTORY_TYPES = [{ type: "quoteItem", name: "Customer Quotes" }];
  const directoryNameToCreate = DIRECTORY_TYPES.find(
    (dir) => dir.type === directoryType,
  )?.name;

  if (!directoryNameToCreate) {
    return null;
  }

  try {
    const directories = await sourceFilesApi.listProjectDirectories(projectId);
    const directory = directories.data.find(
      (dir) => dir.data.name === directoryNameToCreate,
    );

    if (directory?.data.id) {
      return directory?.data.id;
    }

    const newDirectory = await sourceFilesApi.createDirectory(projectId, {
      name: directoryNameToCreate,
    });

    return newDirectory.data.id;
  } catch (e) {
    console.error(e);
    throw new Error(
      "[sanity-plugin-crowdin/backend] Failed to get or create directory id",
    );
  }
}
export async function getOrCreateTranslatedDocuments({
  body,
  rawInput,
  i18nAdapter,
  sourceFileId,
}: {
  sourceFileId: number;
  body: CreateMultipleTranslationsInput;
  rawInput: BackendHandlerRawInput;
  i18nAdapter: I18nAdapter;
}) {
  try {
    await i18nAdapter.getOrCreateTranslatedDocuments({
      sourceDoc: body.currentDocument,
      targetLangs: formatLangsForCrowdin(body.translations),
      sanityClient: rawInput.sanityClient,
      sourceFileId,
    });
  } catch (e) {
    console.error(e);
    throw new Error(
      "[sanity-plugin-crowdin/backend] Failed to create translated documents",
    );
  }
}

export async function fetchSourceFileString({
  projectId,
  sourceStringsApi,
  sourceFileId,
}: {
  projectId: number;
  sourceStringsApi: SourceStrings;
  sourceFileId: number;
}) {
  try {
    return await sourceStringsApi
      .withFetchAll()
      .listProjectStrings(projectId, sourceFileId);
  } catch (e) {
    console.error(e);
    throw new Error(
      "[sanity-plugin-crowdin/backend] Failed to fetch source strings",
    );
  }
}

export async function stringBatchOperations({
  projectId,
  contextUpdateBatchRequest,
  sourceStringsApi,
}: {
  projectId: number;
  contextUpdateBatchRequest: Array<PatchRequest>;
  sourceStringsApi: SourceStrings;
}) {
  try {
    await sourceStringsApi.stringBatchOperations(
      projectId,
      contextUpdateBatchRequest,
    );
  } catch (e) {
    console.error(e);
    throw new Error(
      "[sanity-plugin-crowdin/backend] Failed to update source strings",
    );
  }

  return {
    success: true,
  };
}

export async function addCrowdinStorage({
  uploadStorageApi,
  fileData,
  fileName,
}: {
  uploadStorageApi: UploadStorage;
  fileData: unknown;
  fileName: string;
}) {
  try {
    return await uploadStorageApi.addStorage(fileName, fileData);
  } catch (e) {
    console.error(e);
    throw new Error("[sanity-plugin-crowdin/backend] Failed to create storage");
  }
}
