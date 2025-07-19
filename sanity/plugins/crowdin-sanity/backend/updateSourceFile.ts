import crowdin from "@crowdin/crowdin-api-client";
import type { BackendHandlerRawInput } from "../backendHandler";
import type {
  EndpointActionTypes,
  SanityDocumentWithCrowdinMetadata,
} from "../types";
import { uuid } from "@sanity/uuid";
import { addCrowdinStorage, parser } from "./createTranslations";

export type UpdateSourceFileInput = {
  sourceFileId: number;
  action: EndpointActionTypes.UPDATE_SOURCE_FILE;
  currentDocument: SanityDocumentWithCrowdinMetadata;
};

export async function updateSourceFile({
  body,
  rawInput,
}: {
  body: UpdateSourceFileInput;
  rawInput: BackendHandlerRawInput;
}) {
  const projectId = rawInput.crowdinCredentials.projectId;
  const { sourceFilesApi, uploadStorageApi } = new crowdin({
    token: rawInput.crowdinCredentials.accessToken || "",
    organization: rawInput.crowdinCredentials.organization,
  });

  try {
    const storage = await addCrowdinStorage({
      uploadStorageApi,
      fileData: parser.jsonToHtml(body.currentDocument),
      fileName: body.currentDocument._id + "__" + uuid(),
    });
    const newSourceFile = await sourceFilesApi.updateOrRestoreFile(
      projectId,
      body.sourceFileId,
      {
        storageId: storage.data.id,
      },
    );

    return {
      status: 200,
      body: {
        code: "UpdateSourceFile",
        message: "Source file updated.",
        sourceFile: newSourceFile,
      },
    };
  } catch (e) {
    return {
      status: 404,
      body: {
        code: "SourceFileNotUpdated",
        message: "Source file not updated.",
      },
    };
  }
}
