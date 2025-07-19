"use client";

import { CloseIcon } from "@sanity/icons";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";
import type { ReactNode } from "react";
import type { TranslationFormValue } from "./DocDashboardTranslationForm";
import { usePluginOptions } from "./PluginOptionsProvider";
import type { SanityDocumentWithCrowdinMetadata } from "../types";
import { EndpointActionTypes } from "../types";
import { useFormValue } from "sanity";
import React from "react";

export function CoreTranslationForm(props: {
  formBottomSlot?: ReactNode;
  formTopSlot?: ReactNode;
  formValue: TranslationFormValue;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { formValue, onSuccess } = props;
  const pluginOptions = usePluginOptions();
  const currentDocument = useFormValue([]) as SanityDocumentWithCrowdinMetadata;
  const [loading, setLoading] = React.useState(false);
  const [error, setFormError] = React.useState<string | null>(null);

  const submitTranslationsToCrowdin = React.useCallback(async () => {
    const isValid = validateForm({ formValue, setFormError });
    if (!isValid) return;

    setLoading(true);
    const body = {
      action: EndpointActionTypes.CREATE_TRANSLATIONS,
      translations: formValue.targetLangs,
      sourceFileTitle: formValue.sourceFileTitle,
      currentDocument,
    };

    const res = await fetch(pluginOptions.apiEndpoint, {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 200) {
      setLoading(false);
      onSuccess();
    }

    setLoading(false);
  }, [formValue, pluginOptions, currentDocument, onSuccess]);

  return (
    <Stack as="form" space={4}>
      {props.formTopSlot || null}
      {props.formBottomSlot || null}
      {error !== null && (
        <Card padding={3} border radius={2} tone="caution">
          <Text>{error}</Text>
        </Card>
      )}
      <Flex gap={2} align="center">
        <Button
          text="Cancel"
          icon={CloseIcon}
          onClick={props.onCancel}
          mode="ghost"
          style={{ flex: 1 }}
        />
        <Button
          loading={loading}
          text="Send to Crowdin"
          tone="primary"
          disabled={loading}
          onClick={submitTranslationsToCrowdin}
          mode="ghost"
          style={{ flex: 1 }}
        />
      </Flex>
    </Stack>
  );
}

function validateForm({
  formValue,
  setFormError,
}: {
  formValue: TranslationFormValue;
  setFormError: (error: string | null) => void;
}) {
  if (!formValue.sourceFileTitle) {
    setFormError("Please provide a source file title");
    return false;
  }

  if (!formValue.targetLangs || formValue.targetLangs.length === 0) {
    setFormError("Please select at least one target language");
    return false;
  }

  setFormError(null);
  return true;
}
