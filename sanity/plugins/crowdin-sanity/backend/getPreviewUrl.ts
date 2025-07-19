import type { BackendHandlerRawInput } from "../backendHandler";
import type { EndpointActionTypes } from "../types";

import { buildPreviewUrl } from "../utils/previewUrl";

export type GetPreviewUrlInput = {
  action: EndpointActionTypes.GET_PREVIEW_URL;
  targetLanguage: string;
  sourceDocId: string;
  docType: string;
};

export async function getPreviewUrl({
  body,
  requestUrl,
}: {
  body: GetPreviewUrlInput;
  rawInput: BackendHandlerRawInput;
  requestUrl: string;
}) {
  const origin = new URL(requestUrl).origin;
  const previewUrl = buildPreviewUrl({
    origin,
    targetLang: body.targetLanguage,
    documentType: body.docType,
    sourceDocId: body.sourceDocId,
  });

  return {
    status: 200,
    body: {
      code: "ProjectFound",
      message: "Project found",
      previewUrl,
    },
  };
}
