import type { BackendHandlerRawInput } from "../backendHandler";
import type { EndpointActionTypes } from "../types";

export type RemoveCrowdinMetadataInput = {
  sourceFileId: number;
  action: EndpointActionTypes.REMOVE_CROWDIN_METADATA;
};

export async function removeCrowdinMetadata({
  body,
  rawInput,
}: {
  body: RemoveCrowdinMetadataInput;
  rawInput: BackendHandlerRawInput;
}) {
  const sanityClient = rawInput.sanityClient;
  const i18nAdapter = rawInput.i18nAdapter;

  try {
    await i18nAdapter.removeCrowdinMetadata({
      sourceFileId: body.sourceFileId.toString(),
      sanityClient,
    });

    return {
      status: 200,
      body: {
        code: "RemovedCrowdinMetadata",
        message: "Removed Crowdin metadata.",
        data: {
          success: "ok",
        },
      },
    };
  } catch (err) {
    return {
      status: 404,
      body: {
        code: "ErrorRemovingCrowdinMetadata",
        message: "Error removing Crowdin metadata.",
      },
    };
  }
}
