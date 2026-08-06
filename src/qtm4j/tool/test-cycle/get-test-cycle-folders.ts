import { Tool } from "../../../common/tools";
import type { ToolParams } from "../../../common/types";
import type { Qtm4jClient } from "../../client";
import { ENDPOINTS, TOOL_NAMES, TOOLSETS } from "../../config/constants";
import {
  GetFoldersBody,
  GetFoldersResponse,
  type GetFoldersResponseType,
} from "../../schema/folder.schema";

/**
 * GetTestCycleFolders Tool
 *
 * Retrieves the test cycle folder tree of the active project. This is the lookup
 * for the numeric folderId that the test cycle tools expect — without it the
 * folder ID has to come from the user.
 */
export class GetTestCycleFolders extends Tool<Qtm4jClient> {
  specification: ToolParams = {
    title: TOOL_NAMES.GET_TEST_CYCLE_FOLDERS.TITLE,
    toolset: TOOLSETS.TEST_CYCLES,
    summary: TOOL_NAMES.GET_TEST_CYCLE_FOLDERS.SUMMARY,
    readOnly: true,
    idempotent: true,
    inputSchema: GetFoldersBody,
    outputSchema: GetFoldersResponse,
    purpose:
      "Retrieve the test cycle folder structure of the active QTM4J project as a tree of folders, each with its numeric id and name. " +
      "Use it to resolve a folder the user names in words (e.g. 'the Sprint 42 folder') to the numeric folder ID required by " +
      "create_test_cycle and by the folderId filter of search_test_cycles. " +
      "PREREQUISITE: set_project_context must be called before this tool.",
    useCases: [
      "Find the numeric folderId of a test cycle folder the user referred to by name",
      "Show the user which test cycle folders exist before creating a test cycle",
      "Confirm that a folder path (e.g. 'Releases / 2026') exists in the project",
      "Get a folderId to use in the search_test_cycles filter",
      "See how many test cycles each folder holds",
    ],
    examples: [
      {
        description: "Get the full test cycle folder tree",
        parameters: {},
        expectedOutput:
          "Root-level test cycle folders with their ids, names, and nested children",
      },
      {
        description: "Get the folder tree with test cycle counts per folder",
        parameters: { withCount: true },
        expectedOutput:
          "Folder tree where each folder also has selfCount and totalCount",
      },
      {
        description: "Get the folder tree sorted alphabetically",
        parameters: { sort: "NAME:asc" },
        expectedOutput: "Folder tree ordered by folder name ascending",
      },
    ],
    hints: [
      "PREREQUISITE: set_project_context must be called before this tool. NEVER auto-select a project.",
      "projectId is injected automatically from the active project context — do not ask the user for it.",
      "The response is a tree: root folders are in `data`, subfolders are nested under each folder's `children` array. Walk `children` recursively to find deeper folders.",
      "FOLDER NAMES ARE NOT UNIQUE: the same name can appear in several branches. When more than one folder matches the name the user gave, list the candidates with their parent folders and ask which one they mean — never pick one silently.",
      "Pass the `id` of the chosen folder as `folderId` to create_test_cycle or in the search_test_cycles filter.",
      "This tool returns test cycle folders only. Test case folders are a separate tree — use get_test_case_folders for those.",
    ],
    outputDescription:
      "JSON object with total (number of root-level folders) and data (array of root folders). " +
      "Each folder has id, name, seqNo, created, updated, and children (nested folders of the same shape). " +
      "selfCount and totalCount are only present when withCount is true.",
  };

  handle = async (rawArgs: any) => {
    const args = GetFoldersBody.parse(rawArgs);
    const context = this.client.getResolverRegistry().requireProjectContext();

    const response = await this.client
      .getApiClient()
      .get(ENDPOINTS.TEST_CYCLE_FOLDERS(context.projectId), {
        sort: args.sort,
        withCount: args.withCount,
      });

    const validated: GetFoldersResponseType =
      GetFoldersResponse.parse(response);

    return { structuredContent: validated, content: [] };
  };
}
