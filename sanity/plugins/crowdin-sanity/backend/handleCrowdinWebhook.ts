import type { SanityClient } from "sanity";
import type { BackendHandlerRawInput } from "../backendHandler";
import type {
  CrowdinWebhook,
  CrowdinWebhookEvent,
  CrowdinWebhookFileApprovedPayload,
  CrowdinWebhookFileDeletedPayload,
  CrowdinWebhookTranslationUpdatedPayload,
} from "../types/webook.types";
import type { Translations } from "@crowdin/crowdin-api-client";
import crowdin from "@crowdin/crowdin-api-client";
import type { I18nAdapter } from "../types";
import { getIdFromSourceFileName } from "../utils/ids";

export async function handleCrowdinWebhook(props: {
  rawInput: BackendHandlerRawInput;
  body: CrowdinWebhook;
}) {
  const { translationsApi } = new crowdin({
    token: props.rawInput.crowdinCredentials.accessToken || "",
    organization: props.rawInput.crowdinCredentials.organization,
  });
  const { sanityClient, i18nAdapter } = props.rawInput;
  const webhooks = getWebhooksFromBody(props.body);

  for (const webhook of webhooks) {
    switch (webhook.event) {
      case "file.approved":
        await handleUpdateTranslationDocument({
          webhook,
          sanityClient,
          translationsApi,
          i18nAdapter,
        });
        break;

      case "file.deleted":
        await handleDeleteSourceFile({
          webhook,
          sanityClient,
          i18nAdapter,
        });
        break;

      case "translation.updated":
        await handleCreateTemporaryTranslationDocument({
          webhook,
          sanityClient,
          translationsApi,
          i18nAdapter,
        });
        break;
    }
  }

  return {
    status: 200,
    body: {},
  };
}

async function handleUpdateTranslationDocument({
  webhook,
  sanityClient,
  translationsApi,
  i18nAdapter,
}: {
  webhook: CrowdinWebhookFileApprovedPayload;
  sanityClient: SanityClient;
  translationsApi: Translations;
  i18nAdapter: I18nAdapter;
}) {
  const crowdinSourceFile = webhook.file;
  const crowdinProject = webhook.file.project;
  const crowdinTargetLanguageId = webhook.targetLanguage.id;
  const crowdinSourceFileName = crowdinSourceFile.name;
  const sanitySourceDocumentId = getIdFromSourceFileName(crowdinSourceFileName);

  const translation = await downloadTranslation({
    sourceFileId: crowdinSourceFile.id,
    projectId: crowdinProject.id,
    targetLanguageId: crowdinTargetLanguageId,
    translationsApi,
  });

  try {
    await i18nAdapter.updateTargetDocument({
      sourceDocId: sanitySourceDocumentId,
      translation,
      sanityClient,
      targetLanguageId: crowdinTargetLanguageId,
      markAsCompleted: true,
    });

    console.log(
      "[SourceFileApproved] Successfully updated translation in Sanity on file approved.",
    );
  } catch (err) {
    console.error("Error [SourceFileApproved]", err);
  }
}

async function handleCreateTemporaryTranslationDocument({
  webhook,
  sanityClient,
  translationsApi,
  i18nAdapter,
}: {
  webhook: CrowdinWebhookTranslationUpdatedPayload;
  sanityClient: SanityClient;
  translationsApi: Translations;
  i18nAdapter: I18nAdapter;
}) {
  const crowdinSourceFile = webhook.newTranslation.string.file;
  const crowdinProject = webhook.newTranslation.string.project;
  const crowdinTargetLanguageId = webhook.newTranslation.targetLanguage.id;
  const crowdinSourceFileName = crowdinSourceFile.name;
  const sanitySourceDocumentId = getIdFromSourceFileName(crowdinSourceFileName);

  const translation = await downloadTranslation({
    sourceFileId: crowdinSourceFile.id,
    projectId: crowdinProject.id,
    targetLanguageId: crowdinTargetLanguageId,
    translationsApi,
  });

  try {
     await i18nAdapter.updateTargetDocument({
      sourceDocId: sanitySourceDocumentId,
      translation,
      sanityClient,
      targetLanguageId: crowdinTargetLanguageId,
      markAsCompleted: false,
    });
    console.log(
      "[CreateOrReplaceTemporaryTranslation] Successfully created or replaced temporary translation in Sanity.",
    );
  } catch (err) {
    console.error("Error [CreateOrReplaceTemporaryTranslation]", err);
  }
}

async function handleDeleteSourceFile({
  webhook,
  sanityClient,
  i18nAdapter,
}: {
  webhook: CrowdinWebhookFileDeletedPayload;
  sanityClient: SanityClient;

  i18nAdapter: I18nAdapter;
}) {
  const crowdinSourceFile = webhook.file;

  try {
    await i18nAdapter.removeCrowdinMetadata({
      sourceFileId: crowdinSourceFile.id,
      sanityClient,
    });

    console.log(
      "[DeleteSourceFile] Successfully removed Crowdin metadata in Sanity.",
    );
  } catch (err) {
    console.error("Error [DeleteSourceFile]", err);
  }
}

export async function downloadTranslation({
  sourceFileId,
  projectId,
  targetLanguageId,
  translationsApi,
}: {
  sourceFileId: string | number;
  projectId: string | number;
  targetLanguageId: string;
  translationsApi: Translations;
}) {
  const _projectId =
    typeof projectId === "string" ? parseInt(projectId) : projectId;
  const _sourceFileId =
    typeof sourceFileId === "string" ? parseInt(sourceFileId) : sourceFileId;

  const downloadLink = await translationsApi.buildProjectFileTranslation(
    _projectId,
    _sourceFileId,
    {
      targetLanguageId,
    },
  );
  const response = await fetch(downloadLink.data.url);
  const translations = await response.text();

  return translations;
}

/**
 *
 * Check if body is a batch of webhooks and return an array of webhooks
 */
function getWebhooksFromBody(body: CrowdinWebhook) {
  const webhooks: CrowdinWebhookEvent[] = [];

  if ("events" in body && Array.isArray(body.events)) {
    webhooks.push(...body.events);
  } else if (!("events" in body) && "event" in body) {
    webhooks.push(body);
  }

  return webhooks;
}
