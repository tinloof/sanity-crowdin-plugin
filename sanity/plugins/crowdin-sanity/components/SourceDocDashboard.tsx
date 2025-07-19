"use client";

import DocDashboardCard from "./DocDashboardCard";
import { Button, Card, Flex, Grid, Popover, Stack, Text } from "@sanity/ui";
import type { SanityDocumentWithCrowdinMetadata } from "../types";
import { EndpointActionTypes } from "../types";
import { usePluginOptions } from "./PluginOptionsProvider";
import { isDev, useFormValue } from "sanity";
import { isMainDoc } from "../utils/crowdin";
import type {
  ProjectsGroupsModel,
  TranslationStatusModel,
} from "@crowdin/crowdin-api-client";
import { isDraft } from "../utils/ids";
import _ from "lodash";
import React, { Fragment } from "react";
import { parser } from "../backend/createTranslations";
import { EllipsisVerticalIcon } from "@sanity/icons";

type TranslationsProgress = Array<{
  data: TranslationStatusModel.LanguageProgress;
}>;

export function SourceDocDashboard() {
  const pluginOptions = usePluginOptions();
  const apiEndpoint = pluginOptions.apiEndpoint;
  const currentDocument = useFormValue([]) as SanityDocumentWithCrowdinMetadata;
  const [sourceFileHasDiffs, setSourceFileHasDiffs] = React.useState(false);
  const mainDoc = isMainDoc(currentDocument);
  const sourceFileId = currentDocument.crowdinMetadata?.sourceFileId;
  const [fileProgress, setFileProgress] = React.useState<"inprogress" | "done">(
    "inprogress",
  );
  const [translationsProgress, setTranslationsProgress] =
    React.useState<TranslationsProgress | null>(null);

  const compareSourceFileDiff = React.useCallback(
    async (sourceFile: unknown) => {
      const keysToOmit = [
        "crowdinMetadata",
        "_updatedAt",
        "_rev",
        "_createdAt",
      ];

      try {
        const currentDocClean = _.omit(currentDocument, keysToOmit);
        const sourceFileClean = _.omit(
          parser.htmlToJson(sourceFile as string),
          keysToOmit,
        );

        const isEqual = _.isEqual(currentDocClean, sourceFileClean);
        if (isEqual) {
          setSourceFileHasDiffs(false);
          return;
        }

        if (!isDraft(currentDocument._id)) {
          setSourceFileHasDiffs(true);
        }
      } catch (error) {
        console.error("Failed to parse source file:", error);
      }
    },
    [currentDocument],
  );

  const getSourceFile = React.useCallback(async () => {
    if (!sourceFileId || !mainDoc) return;

    const body = {
      action: EndpointActionTypes.GET_SOURCE_FILE_DATA,
      sourceFileId,
    };
    const res = await fetch(apiEndpoint, {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return;

    const json = await res.json();

    compareSourceFileDiff(json.sourceFile);
  }, [sourceFileId, compareSourceFileDiff, mainDoc, apiEndpoint]);

  const getSourceFileTranslationProgress = React.useCallback(async () => {
    if (!sourceFileId || !mainDoc) return;

    const body = {
      action: EndpointActionTypes.GET_FILE_PROGRESS,
      sourceFileId,
    };

    const res = await fetch(apiEndpoint, {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return;

    const { data } = (await res.json()) as {
      data: TranslationsProgress;
    };

    setTranslationsProgress(data);

    const fullyTranslatedLangs = data.filter(
      (lang) => lang.data.approvalProgress === 100,
    );
    if (fullyTranslatedLangs.length === data.length) {
      setFileProgress("done");
    }
  }, [sourceFileId, mainDoc, apiEndpoint]);

  React.useEffect(() => {
    getSourceFile();
    getSourceFileTranslationProgress();
  }, [getSourceFile, getSourceFileTranslationProgress]);

  return (
    <DocDashboardCard
      title={
        fileProgress === "inprogress"
          ? "Translation in progress"
          : "Translation ready"
      }
      collapsible={false}
      headerActions={
        <ViewProjectButton
          sourceFileId={sourceFileId}
          apiEndpoint={apiEndpoint}
        />
      }
    >
      {sourceFileHasDiffs && (
        <UpdateSourceFileCard
          getSourceFile={getSourceFile}
          sourceFileId={sourceFileId}
          apiEndpoint={apiEndpoint}
        />
      )}
      <Grid gap={4}>
        <Grid columns={[2, 3]}>
          <Text weight="bold">Language</Text>
          <Text weight="bold">Progress</Text>
        </Grid>
        <Grid
          gapX={3}
          gapY={4}
          style={{ alignItems: "center" }}
          columns={[2, 3]}
        >
          {translationsProgress &&
            translationsProgress.length > 0 &&
            translationsProgress
              .sort((a, b) => b.data.words.total - a.data.words.total)
              .map((translation) =>
                translation.data.words.total > 0 ? (
                  <Fragment key={translation.data.language.locale}>
                    <Card padding={2}>
                      <Text>{translation.data.language.name}</Text>
                    </Card>
                    <Card padding={2}>
                      <Text>{translation.data.translationProgress} %</Text>
                    </Card>
                    <Card padding={2} />
                  </Fragment>
                ) : (
                  <Fragment key={translation.data.language.locale}>
                    <Card padding={2}>
                      <Text>{translation.data.language.name}</Text>
                    </Card>
                    <Card padding={2}>
                      <Text>No translations</Text>
                    </Card>
                    <Card padding={2} />
                  </Fragment>
                ),
              )}
        </Grid>
      </Grid>
    </DocDashboardCard>
  );
}

function ViewProjectButton(props: {
  apiEndpoint: string;
  sourceFileId?: number;
}) {
  const { apiEndpoint, sourceFileId } = props;
  const [projectUrl, setProjectUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const onTogglePopover = React.useCallback(
    () => setPopoverOpen(!popoverOpen),
    [popoverOpen],
  );

  const getProjectURL = React.useCallback(async () => {
    try {
      const body = {
        action: EndpointActionTypes.GET_PROJECT,
      };

      const res = await fetch(apiEndpoint, {
        body: JSON.stringify(body),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) return;

      const { project } = (await res.json()) as {
        project: {
          data: ProjectsGroupsModel.Project & {
            webUrl: string;
          };
        };
      };

      setProjectUrl(project?.data.webUrl);
    } catch (e) {
      console.error(e);
    }
  }, [apiEndpoint]);

  const onCancelTranslation = React.useCallback(async () => {
    try {
      setLoading(true);
      const body = {
        action: EndpointActionTypes.REMOVE_CROWDIN_METADATA,
        sourceFileId,
      };

      await fetch(apiEndpoint, {
        body: JSON.stringify(body),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  }, [apiEndpoint, sourceFileId]);

  React.useEffect(() => {
    if (!projectUrl) {
      getProjectURL();
    }
  }, [getProjectURL, projectUrl]);

  return (
    <Flex gap={2}>
      {projectUrl && (
        <Button
          target="_blank"
          as="a"
          href={projectUrl}
          text="Project in Crowdin"
          tone="primary"
        />
      )}
      {isDev && (
        <Popover
          content={
            <Button
              text="Cancel translation"
              loading={loading}
              onClick={onCancelTranslation}
              mode="ghost"
            />
          }
          open={popoverOpen}
        >
          <Button
            mode="ghost"
            onClick={onTogglePopover}
            icon={EllipsisVerticalIcon}
          />
        </Popover>
      )}
    </Flex>
  );
}

function UpdateSourceFileCard(props: {
  sourceFileId?: number;
  apiEndpoint: string;
  getSourceFile: () => void;
}) {
  const currentDocument = useFormValue([]) as SanityDocumentWithCrowdinMetadata;
  const { sourceFileId, apiEndpoint, getSourceFile } = props;
  const [loading, setLoading] = React.useState(false);

  const updateSourceFile = React.useCallback(async () => {
    setLoading(true);
    if (!sourceFileId) {
      setLoading(false); // Reset loading state if sourceFileId is not provided
      return;
    }

    const body = {
      action: EndpointActionTypes.UPDATE_SOURCE_FILE,
      sourceFileId,
      currentDocument,
    };

    const res = await fetch(apiEndpoint, {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    setLoading(false);

    if (!res.ok) return;

    getSourceFile();
  }, [sourceFileId, apiEndpoint, currentDocument, getSourceFile]);

  return (
    <Card marginY={4} padding={[3, 3, 4]} radius={2} shadow={1} tone="caution">
      <Stack space={3}>
        <Text>
          The source document has changed since the last time it was uploaded to
          Crowdin. You can update the Crowdin source file with the button below.
        </Text>
        <Flex>
          <Button
            text="Update source file"
            loading={loading}
            onClick={updateSourceFile}
            tone="caution"
          />
        </Flex>
      </Stack>
    </Card>
  );
}
