"use client";

import type { SanityDocumentWithCrowdinMetadata } from "../types";
import { usePluginOptions } from "./PluginOptionsProvider";
import { useFormValue } from "sanity";
import { Button, Flex } from "@sanity/ui";
import React from "react";

export function TargetDocDashboard() {
  const pluginOptions = usePluginOptions();
  const { apiEndpoint, i18nAdapter } = pluginOptions;
  const currentDocument = useFormValue([]) as SanityDocumentWithCrowdinMetadata;
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const getPreviewUrl = React.useCallback(async () => {
    try {
      const data = await i18nAdapter.getPreviewUrl({
        currentDocument,
        apiEndpoint,
      });

      setPreviewUrl(data.previewUrl);
    } catch (err) {
      console.log(err);
    }
  }, [currentDocument, apiEndpoint, i18nAdapter]);

  React.useEffect(() => {
    if (!previewUrl) {
      getPreviewUrl();
    }
  }, [previewUrl, getPreviewUrl]);

  if (!previewUrl) {
    return null;
  }

  return (
    <Flex gap={3}>
      <Button
        text="Preview translation"
        as="a"
        target="_blank"
        href={previewUrl}
      />
      <RefreshPtdButton />
    </Flex>
  );
}

function RefreshPtdButton() {
  const pluginOptions = usePluginOptions();
  const { apiEndpoint, i18nAdapter } = pluginOptions;
  const currentDocument = useFormValue([]) as SanityDocumentWithCrowdinMetadata;
  const [loading, setLoading] = React.useState(false);

  const refreshPtd = React.useCallback(async () => {
    setLoading(true);
    try {
      await i18nAdapter.refreshPtd({
        currentDocument,
        apiEndpoint,
      });
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }, [currentDocument, apiEndpoint, i18nAdapter]);

  return (
    <Button
      text="Refresh translation preview"
      loading={loading}
      onClick={refreshPtd}
      mode="bleed"
    />
  );
}
