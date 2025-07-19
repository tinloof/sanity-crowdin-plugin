import crowdin from "@crowdin/crowdin-api-client";
import type { BackendHandlerRawInput } from "../backendHandler";
import type { EndpointActionTypes } from "../types";
import { downloadTranslation } from "./handleCrowdinWebhook";

export type RefreshPtdInput = {
  action: EndpointActionTypes.REFRESH_PTD;
  sourceFileId: number;
  sourceDocId: string;
  targetLanguage: string;
};

export async function refreshPtd({
  body,
  rawInput,
}: {
  body: RefreshPtdInput;
  rawInput: BackendHandlerRawInput;
}) {
  const sanityClient = rawInput.sanityClient;
  const i18nAdapter = rawInput.i18nAdapter;
  const projectId = rawInput.crowdinCredentials.projectId;
  const { translationsApi } = new crowdin({
    token: rawInput.crowdinCredentials.accessToken || "",
    organization: rawInput.crowdinCredentials.organization,
  });
  const targetLanguageId = body.targetLanguage;

  const translation = await downloadTranslation({
    sourceFileId: body.sourceFileId,
    projectId,
    targetLanguageId,
    translationsApi,
  });

  try {
    await i18nAdapter.createOrReplacePtd({
      sourceDocId: body.sourceDocId,
      translation,
      sanityClient,
      targetLanguageId,
    });

    return {
      status: 200,
      body: {
        code: "RefreshTemporaryTranslation",
        message: "Refresh temporary translation",
      },
    };
  } catch (err) {
    return {
      status: 404,
      body: {
        code: "ErrorRefreshTemporaryTranslation",
        message: "Failer to refresh temporary translation",
      },
    };
  }
}
