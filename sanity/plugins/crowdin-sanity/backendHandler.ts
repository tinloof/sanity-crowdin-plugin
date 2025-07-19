import type { SanityClient } from "sanity";
import { InvalidRequestError } from "./backendHelpers";
import type { CreateMultipleTranslationsInput } from "./backend/createTranslations";
import { createMultipleTranslations } from "./backend/createTranslations";
import type { CrowdinPluginOptions } from "./types";
import { EndpointActionTypes } from "./types";
import type { CrowdinWebhook } from "./types/webook.types";
import type { GetSourceFileDataInput } from "./backend/getSourceFileData";
import { getSourceFileData } from "./backend/getSourceFileData";
import { handleCrowdinWebhook } from "./backend/handleCrowdinWebhook";
import type { GetFileProgressInput } from "./backend/getFileProgress";
import { getFileProgress } from "./backend/getFileProgress";
import type { UpdateSourceFileInput } from "./backend/updateSourceFile";
import { updateSourceFile } from "./backend/updateSourceFile";
import type { GetProjectInput } from "./backend/getProject";
import { getProject } from "./backend/getProject";
import type { GetPreviewUrlInput } from "./backend/getPreviewUrl";
import { getPreviewUrl } from "./backend/getPreviewUrl";
import type { RefreshPtdInput } from "./backend/refreshPtd";
import { refreshPtd } from "./backend/refreshPtd";
import type { RemoveCrowdinMetadataInput } from "./backend/removeCrowdinMetadata";
import { removeCrowdinMetadata } from "./backend/removeCrowdinMetadata";

export type BackendHandlerRawInput = {
  sanityClient: SanityClient;
  crowdinCredentials: {
    accessToken: string;
    projectId: number;
    organization?: string;
  };
  i18nAdapter: CrowdinPluginOptions["i18nAdapter"];
  supportedTargetLangs: CrowdinPluginOptions["supportedTargetLangs"];
};

function isBodyWebhook(body: object): body is CrowdinWebhook {
  if (!("events" in body) && "event" in body) {
    return true;
  }

  return "events" in body && Array.isArray(body.events);
}

export function createInternalHandler(rawInput: BackendHandlerRawInput) {
  parseInput(rawInput);
  const handler = async ({
    body,
    requestUrl,
  }: {
    body: unknown;
    requestUrl: string;
  }) => {
    if (typeof body !== "object" || !body) {
      return new InvalidRequestError();
    }

    if (isBodyWebhook(body)) {
      return await handleCrowdinWebhook({
        body: body as CrowdinWebhook,
        rawInput,
      });
    }

    if (
      !("action" in body) ||
      typeof body.action !== "string" ||
      !Object.values(EndpointActionTypes).includes(
        body.action as EndpointActionTypes,
      )
    ) {
      return new InvalidRequestError();
    }

    if (body.action === EndpointActionTypes.CREATE_TRANSLATIONS) {
      if (
        !("translations" in body) ||
        !Array.isArray(body.translations) ||
        body.translations.length === 0
      ) {
        return new InvalidRequestError();
      }

      return await createMultipleTranslations({
        body: body as CreateMultipleTranslationsInput,
        rawInput,
        requestUrl,
      });
    }

    if (body.action === EndpointActionTypes.GET_SOURCE_FILE_DATA) {
      if (!("sourceFileId" in body)) {
        return new InvalidRequestError();
      }

      return await getSourceFileData({
        body: body as GetSourceFileDataInput,
        rawInput,
      });
    }

    if (body.action === EndpointActionTypes.GET_FILE_PROGRESS) {
      if (!("sourceFileId" in body)) {
        return new InvalidRequestError();
      }

      return await getFileProgress({
        body: body as GetFileProgressInput,
        rawInput,
      });
    }

    if (body.action === EndpointActionTypes.REMOVE_CROWDIN_METADATA) {
      if (!("sourceFileId" in body)) {
        return new InvalidRequestError();
      }

      return await removeCrowdinMetadata({
        body: body as RemoveCrowdinMetadataInput,
        rawInput,
      });
    }

    if (body.action === EndpointActionTypes.UPDATE_SOURCE_FILE) {
      if (!("sourceFileId" in body) || !("currentDocument" in body)) {
        return new InvalidRequestError();
      }

      return await updateSourceFile({
        body: body as UpdateSourceFileInput,
        rawInput,
      });
    }

    if (body.action === EndpointActionTypes.GET_PROJECT) {
      return await getProject({
        body: body as GetProjectInput,
        rawInput,
      });
    }

    if (body.action === EndpointActionTypes.GET_PREVIEW_URL) {
      if (
        !("targetLanguage" in body) ||
        !("targetLanguage" in body) ||
        !("docType" in body) ||
        !("sourceDocId" in body)
      ) {
        return new InvalidRequestError();
      }

      return await getPreviewUrl({
        body: body as GetPreviewUrlInput,
        rawInput,
        requestUrl,
      });
    }

    if (body.action === EndpointActionTypes.REFRESH_PTD) {
      if (
        !("targetLanguage" in body) ||
        !("sourceFileId" in body) ||
        !("sourceDocId" in body)
      ) {
        return new InvalidRequestError();
      }

      return await refreshPtd({
        body: body as RefreshPtdInput,
        rawInput,
      });
    }
  };

  return async function internalHandler({
    body,
    requestUrl,
  }: {
    body: unknown;
    requestUrl: string;
  }) {
    const result = await handler({ body, requestUrl });

    if (result instanceof InvalidRequestError) {
      throw result;
    } else if (!result) {
      throw new Error("[sanity-plugin-crowdin/backend] Unknown error");
    }

    return result;
  };
}

function parseInput(input: BackendHandlerRawInput) {
  const { sanityClient, crowdinCredentials } = input;
  const credentials = crowdinCredentials;

  if (!sanityClient.config().token) {
    throw new Error(
      "[sanity-plugin-crowdin/backend] Missing write Sanity client",
    );
  }

  if (!sanityClient.config().token) {
    throw new Error(
      "[sanity-plugin-crowdin/backend] Missing write token in Sanity client",
    );
  }

  if (!credentials) {
    throw new Error(
      "[sanity-plugin-crowdin/backend] Missing `crowdinCredentials`",
    );
  }

  if (!credentials.accessToken || typeof credentials.accessToken !== "string") {
    throw new Error(
      "[sanity-plugin-crowdin/backend] Missing `crowdinCredentials.accessToken`",
    );
  }

  return input;
}
