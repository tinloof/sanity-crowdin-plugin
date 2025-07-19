type TargetLanguage = {
  id: string;
  name: string;
  editorCode: string;
  twoLettersCode: string;
  threeLettersCode: string;
  locale: string;
  androidCode: string;
  osxCode: string;
  osxLocale: string;
  textDirection: string;
  dialectOf: string;
};

type User = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
};

type Project = {
  id: string;
  userId: string;
  sourceLanguageId: string;
  targetLanguageIds: string[];
  identifier: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  description: string;
  url: string;
  cname: string | null;
  languageAccessPolicy: string;
  visibility: string;
  publicDownloads: boolean;
};

type File = {
  id: string;
  name: string;
  title: string;
  type: string;
  path: string;
  status: string;
  revision: string;
  branchId: string;
  directoryId: string;
};

export type CrowdinWebhookTranslationUpdatedPayload = {
  event: "translation.updated";
  oldTranslation: {
    id: string;
    text: string;
    pluralCategoryName: string | null;
    rating: string;
    provider: string;
    isPreTranslated: boolean;
    createdAt: string;
  };
  newTranslation: {
    id: string;
    text: string;
    pluralCategoryName: string | null;
    rating: string;
    provider: string;
    isPreTranslated: boolean;
    createdAt: string;
    user: User;
    targetLanguage: TargetLanguage;
    string: {
      id: string;
      identifier: string;
      key: string;
      text: string;
      type: string;
      context: string;
      maxLength: string;
      isHidden: boolean;
      isDuplicate: boolean;
      masterStringId: string | null;
      revision: string;
      hasPlurals: boolean;
      labelIds: string[];
      url: string;
      createdAt: string;
      updatedAt: string;
      file: File;
      project: Project;
    };
  };
};

export type CrowdinWebhookFileTranslatedPayload = {
  event: "file.translated";
  file: File & {
    project: Project;
  };
  targetLanguage: TargetLanguage;
};

export type CrowdinWebhookFileApprovedPayload = {
  event: "file.approved";
  file: File & {
    project: Project;
  };
  targetLanguage: TargetLanguage;
};

export type CrowdinWebhookFileDeletedPayload = {
  event: "file.deleted";
  file: File & {
    project: Project;
  };
  user: User;
};

export type CrowdinWebhookEvent =
  | CrowdinWebhookTranslationUpdatedPayload
  | CrowdinWebhookFileTranslatedPayload
  | CrowdinWebhookFileDeletedPayload
  | CrowdinWebhookFileApprovedPayload;

export type CrowdinWebhook =
  | CrowdinWebhookEvent
  | {
      events: CrowdinWebhookEvent[];
    };
