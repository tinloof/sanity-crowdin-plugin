import crowdin from "@crowdin/crowdin-api-client";
import type { BackendHandlerRawInput } from "../backendHandler";
import type { EndpointActionTypes } from "../types";

export type GetFileProgressInput = {
  sourceFileId: number;
  action: EndpointActionTypes.GET_FILE_PROGRESS;
};

export async function getFileProgress({
  body,
  rawInput,
}: {
  body: GetFileProgressInput;
  rawInput: BackendHandlerRawInput;
}) {
  const projectId = rawInput.crowdinCredentials.projectId;
  const { translationStatusApi } = new crowdin({
    token: rawInput.crowdinCredentials.accessToken || "",
    organization: rawInput.crowdinCredentials.organization,
  });

  try {
    const file = await translationStatusApi.getFileProgress(
      projectId,
      body.sourceFileId,
    );

    return {
      status: 200,
      body: {
        code: "FileProgressFetched",
        message: "Source file fetched",
        data: file.data,
      },
    };
  } catch (e) {
    return {
      status: 404,
      body: {
        code: "FileProgressNotFound",
        message: "Source file not found",
      },
    };
  }
}
