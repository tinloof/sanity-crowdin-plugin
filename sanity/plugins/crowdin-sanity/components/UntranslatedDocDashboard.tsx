"use client";

import { Button, Text } from "@sanity/ui";
import { isDraft } from "sanity";
import type { SanityDocumentWithCrowdinMetadata } from "../types";
import { usePluginOptions } from "./PluginOptionsProvider";
import DocDashboardCard from "./DocDashboardCard";

export default function UntranslatedDocDashboard(props: {
  currentDocument: SanityDocumentWithCrowdinMetadata;
  openDialog: () => void;
}) {
  const { sourceLang, i18nAdapter } = usePluginOptions();
  const docLang = i18nAdapter.getDocumentLang(props.currentDocument);
  const documentId = props.currentDocument._id;

  if (!docLang || docLang !== sourceLang) return null;

  const dialogId = `crowdin-translation-dialog--${documentId}`;

  const blockDraftTranslation = isDraft(props.currentDocument);

  return (
    <DocDashboardCard
      title="Untranslated document"
      subtitle={
        <Text>
          This document has not been translated to any of the target languages
          yet.
        </Text>
      }
      collapsible={false}
      headerActions={
        <Button
          text="Translate in Crowdin"
          tone="primary"
          disabled={blockDraftTranslation}
          onClick={props.openDialog}
          aria-haspopup="dialog"
          aria-controls={dialogId}
        />
      }
    />
  );
}
