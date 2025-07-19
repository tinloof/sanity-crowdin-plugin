"use client";

import type { PropsWithChildren } from "react";

import type { CrowdinPluginOptions } from "../types";
import { type LangCode } from "../types";
import { documentInternationalizationAdapter } from "../adapters";
import type { ObjectFieldProps } from "sanity";
import React from "react";

const defaultAdapter = documentInternationalizationAdapter();

const PluginOptionsContext = React.createContext<
  CrowdinPluginOptions & {
    inputProps: ObjectFieldProps["inputProps"] | undefined;
  }
>({
  sourceLang: "" as LangCode,
  supportedTargetLangs: [],
  translatableTypes: [],
  i18nAdapter: defaultAdapter,
  apiEndpoint: "",
  inputProps: undefined,
});

export function PluginOptionsProvider(
  props: PropsWithChildren<{
    pluginOptions: CrowdinPluginOptions;
    rootProps: ObjectFieldProps;
  }>,
) {
  return (
    <PluginOptionsContext.Provider
      value={{ ...props.pluginOptions, inputProps: props.rootProps.inputProps }}
    >
      {props.children}
    </PluginOptionsContext.Provider>
  );
}

export function usePluginOptions() {
  return React.useContext(PluginOptionsContext);
}
