"use client";

import { Box, Card, Dialog } from "@sanity/ui";
import type { ObjectFieldProps } from "sanity";
import { useDocumentStore, useFormValue } from "sanity";
import { useTMDs } from "../hooks/useTMDs";
import type {
  CrowdinPluginOptions,
  LangCode,
  SanityDocumentWithCrowdinMetadata,
  TranslationInput,
} from "../types";
import { isMainDoc } from "../utils/crowdin";
import { FULL_DOC_DIFF_PATH } from "../utils/paths";
import { DocDashboardTranslationForm } from "./DocDashboardTranslationForm";
import { PluginOptionsProvider } from "./PluginOptionsProvider";
import UntranslatedDocDashboard from "./UntranslatedDocDashboard";
import { SourceDocDashboard } from "./SourceDocDashboard";
import { TargetDocDashboard } from "./TargetDocDashboard";
import { undraftId } from "../utils/ids";
import React from "react";

export default function getCrowdinDocDashboard(
  pluginOptions: CrowdinPluginOptions,
) {
  return function PhraseDocDashboard(props: ObjectFieldProps) {
    const currentDocument = useFormValue(
      [],
    ) as SanityDocumentWithCrowdinMetadata;
    const documentStore = useDocumentStore();
    const [TMDs, TMDsLoading] = useTMDs({
      documentStore,
      docId: undraftId(currentDocument._id),
      docType: currentDocument._type,
    });
    const [toTranslate, setToTranslate] = React.useState<{
      diffs: TranslationInput["diffs"];
      targetLangs?: LangCode[];
    } | null>(null);
    const docLang = pluginOptions.i18nAdapter.getDocumentLang(currentDocument);
    const mainDoc = isMainDoc(currentDocument);
    const TMDsWithCrowdinMetadata =
      TMDs?.translationsMetadata?.translations
        ?.map((doc) => {
          return {
            ...doc,
            crowdinMetadata: TMDs?.crowdinDocs?.find(
              (d) => undraftId(d._id) === doc.value?._ref,
            ),
          };
        })
        .filter((doc) => doc.crowdinMetadata) || [];

    const isTranslatedMainDoc =
      (mainDoc &&
        TMDsWithCrowdinMetadata &&
        TMDsWithCrowdinMetadata.length > 0) ||
      false;
    const isUntranslatedMainDoc = mainDoc && !isTranslatedMainDoc;

    if (
      !currentDocument ||
      TMDsLoading ||
      !docLang ||
      // Don't show anything for target langs with no translations - source will show UntranslatedDocDashboard
      (isUntranslatedMainDoc && docLang !== pluginOptions.sourceLang) ||
      // Don't show anything if the main doc is already translated in all target langs
      (TMDsWithCrowdinMetadata &&
        TMDsWithCrowdinMetadata.length === 0 &&
        TMDs?.translationsMetadata?.translations?.length ===
          [...pluginOptions.supportedTargetLangs, pluginOptions.sourceLang]
            .length)
    )
      return null;

    return (
      <PluginOptionsProvider rootProps={props} pluginOptions={pluginOptions}>
        <Card>
          {!isUntranslatedMainDoc && mainDoc && <SourceDocDashboard />}
          {!isUntranslatedMainDoc && !mainDoc && <TargetDocDashboard />}
          {isUntranslatedMainDoc && (
            <UntranslatedDocDashboard
              currentDocument={currentDocument}
              openDialog={() => setToTranslate({ diffs: [FULL_DOC_DIFF_PATH] })}
            />
          )}

          {toTranslate && (
            <Dialog
              header="Translate with Crowdin"
              // Prohibit closing directly, only allow closing by clicking the Cancel button in TranslationForm
              onClose={undefined}
              zOffset={1000}
              id={`crowdin-translation-dialog--${currentDocument._id}`}
              width={1}
            >
              <Box padding={4}>
                <DocDashboardTranslationForm
                  TMDs={TMDs}
                  onCancel={() => setToTranslate(null)}
                  currentDocument={currentDocument}
                  toTranslate={toTranslate}
                  sourceLang={docLang}
                />
              </Box>
            </Dialog>
          )}
        </Card>
      </PluginOptionsProvider>
    );
  };
}
