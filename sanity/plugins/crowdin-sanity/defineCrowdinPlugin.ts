import type { CrowdinPluginOptions } from "./types";

export default function defineCrowdinOptions(
  options: CrowdinPluginOptions
): CrowdinPluginOptions {
  return {
    ...options,
  };
}
