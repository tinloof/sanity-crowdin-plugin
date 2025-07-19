import crowdin from "@crowdin/crowdin-api-client";
import type { BackendHandlerRawInput } from "../backendHandler";
import type { EndpointActionTypes } from "../types";

export type GetProjectInput = {
  action: EndpointActionTypes.GET_PROJECT;
};

export async function getProject({
  body,
  rawInput,
}: {
  body: GetProjectInput;
  rawInput: BackendHandlerRawInput;
}) {
  const projectId = rawInput.crowdinCredentials.projectId;
  const { projectsGroupsApi } = new crowdin({
    token: rawInput.crowdinCredentials.accessToken || "",
    organization: rawInput.crowdinCredentials.organization,
  });

  try {
    const project = await projectsGroupsApi.getProject(projectId);
    return {
      status: 200,
      body: {
        code: "ProjectFound",
        message: "Project found",
        project,
      },
    };
  } catch (e) {
    return {
      status: 404,
      body: {
        code: "ProjectNotFound",
        message: "Project not found",
      },
    };
  }
}
