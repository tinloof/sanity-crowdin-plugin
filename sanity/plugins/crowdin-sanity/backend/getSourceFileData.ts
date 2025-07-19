import crowdin from "@crowdin/crowdin-api-client";
import type { BackendHandlerRawInput } from "../backendHandler";
import type { EndpointActionTypes } from "../types";

export type GetSourceFileDataInput = {
  sourceFileId: number;
  action: EndpointActionTypes.GET_SOURCE_FILE_DATA;
};

export async function getSourceFileData({
  body,
  rawInput,
}: {
  body: GetSourceFileDataInput;
  rawInput: BackendHandlerRawInput;
}) {
  const projectId = rawInput.crowdinCredentials.projectId;
  const { sourceFilesApi } = new crowdin({
    token: rawInput.crowdinCredentials.accessToken || "",
    organization: rawInput.crowdinCredentials.organization,
  });

  try {
    const downloadLink = await sourceFilesApi.downloadFile(
      projectId,
      body.sourceFileId,
    );
    const response = await fetch(downloadLink.data.url);
    const sourceFile = await response.text();
    return {
      status: 200,
      body: {
        code: "SourceFileFound",
        message: "Source file found",
        sourceFile,
      },
    };
  } catch (e) {
    return {
      status: 404,
      body: {
        code: "SourceFileNotFound",
        message: "Source file not found",
      },
    };
  }
}
