"use client";

import { FormField } from "sanity";
import type {
  LangCode,
  SanityDocumentWithCrowdinMetadata,
  SanityTMD,
  TranslationInput,
} from "../types";
import { usePluginOptions } from "./PluginOptionsProvider";
import { CoreTranslationForm } from "./CoreTranslationForm";

import { Box, Checkbox, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { getReadableLanguageName, targetLangsIntersect } from "../utils/langs";
import React from "react";

export type NewSourceInput = {
  type: "new";
  targetLangs: LangCode[];
  sourceLang: LangCode;
};

export type ExistingSourceInput = {
  type: "existing";
  sourceTargetLangs: LangCode[];
};

export type TranslationSourceInput = ExistingSourceInput | NewSourceInput;

export type TranslationProjectFormValue = {
  sourceType: TranslationSourceInput["type"];
  sourceFileTitle: string;
};

export type TranslationFormValue = Pick<TranslationInput, "targetLangs"> &
  TranslationProjectFormValue;

export function DocDashboardTranslationForm(props: {
  onCancel: () => void;
  TMDs?: SanityTMD;
  currentDocument: SanityDocumentWithCrowdinMetadata;
  sourceLang: LangCode;
  toTranslate: {
    diffs: TranslationInput["diffs"];
    targetLangs?: LangCode[];
  };
}) {
  const pluginOptions = usePluginOptions();
  const { supportedTargetLangs } = pluginOptions;

  const [formValue, setFormValue] = React.useState<TranslationFormValue>({
    sourceType: "new",
    targetLangs: [],
    sourceFileTitle: "",
  });

  const configurableLangs = supportedTargetLangs;

  return (
    <CoreTranslationForm
      formValue={formValue}
      onCancel={props.onCancel}
      onSuccess={props.onCancel}
      formBottomSlot={
        <>
          <FormField title="Crowdin source file name">
            <TextInput
              onChange={(e) =>
                setFormValue({
                  ...formValue,
                  sourceFileTitle: e.currentTarget.value,
                })
              }
              placeholder="Crowdin source file name"
            />
          </FormField>
          {configurableLangs.length > 0 && (
            <FormField title="Target language">
              <Stack space={2} paddingLeft={1}>
                {configurableLangs.map((lang) => {
                  const targetLangDocument =
                    props.TMDs?.translationsMetadata?.translations?.filter(
                      (t) => t._key === lang,
                    );

                  const targetAlreadyTranslated =
                    targetLangDocument && targetLangDocument.length > 0
                      ? true
                      : false;

                  return (
                    <Flex
                      align="center"
                      as="label"
                      style={{ opacity: targetAlreadyTranslated ? 0.5 : 1 }}
                      key={lang}
                    >
                      <Checkbox
                        name="targetLanguages"
                        disabled={targetAlreadyTranslated}
                        id={lang}
                        style={{ display: "block" }}
                        checked={targetLangsIntersect(formValue.targetLangs, [
                          lang,
                        ])}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;

                          const targetLangs =
                            ((): typeof formValue.targetLangs => {
                              if (checked) {
                                return targetLangsIntersect(
                                  formValue.targetLangs,
                                  [lang],
                                )
                                  ? formValue.targetLangs
                                  : [...formValue.targetLangs, lang];
                              }

                              return formValue.targetLangs.filter(
                                (l) => l !== lang,
                              );
                            })();

                          setFormValue({
                            ...formValue,
                            targetLangs,
                          });
                        }}
                      />
                      <Box flex={1} paddingLeft={3}>
                        <Flex gap={1} align="center">
                          <Text>{getReadableLanguageName(lang)}</Text>
                          {targetAlreadyTranslated && (
                            <Text muted size={1}>
                              (translation already exists)
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>
            </FormField>
          )}
        </>
      }
    />
  );
}
