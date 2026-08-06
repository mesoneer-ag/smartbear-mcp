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
 * GetTestCaseFolders Tool
 *
 * Retrieves the test case folder tree of the active project. This is the lookup
 * for the numeric folderId that the test case tools expect — without it the
 * folder ID has to come from the user.
 */
export class GetTestCaseFolders extends Tool<Qtm4jClient> {
  specification: ToolParams = {
    title: TOOL_NAMES.GET_TEST_CASE_FOLDERS.TITLE,
    toolset: TOOLSETS.TEST_CASES,
    summary: TOOL_NAMES.GET_TEST_CASE_FOLDERS.SUMMARY,
    readOnly: true,
    idempotent: true,
    inputSchema: GetFoldersBody,
    outputSchema: GetFoldersResponse,
    purpose:
      "Retrieve the test case folder structure of the active QTM4J project as a tree of folders, each with its numeric id and name. " +
      "Use it to resolve a folder the user names in words (e.g. 'the Regression folder') to the numeric folder ID required by " +
      "create_test_case and by the folder filters of the test case search and link tools. " +
      "PREREQUISITE: set_project_context must be called before this tool.",
    useCases: [
      "Find the numeric folderId of a test case folder the user referred to by name",
      "Show the user which test case folders exist before creating a test case",
      "Confirm that a folder path (e.g. 'Regression / Sprint 42') exists in the project",
      "Get folder IDs to use in the folders filter of search_test_cases",
      "Get a folder ID to narrow the test cases picked up by the link tools",
      "See how many test cases each folder holds",
    ],
    examples: [
      {
        description: "Get the full test case folder tree",
        parameters: {},
        expectedOutput:
          "Root-level test case folders with their ids, names, and nested children",
      },
      {
        description: "Get the folder tree with test case counts per folder",
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
      "Pass the `id` of the chosen folder as `folderId` to create_test_case, in the `folders` filter of search_test_cases, or in the `folderId` filter of the test case link tools.",
      "This tool returns test case folders only. Test cycle folders are a separate tree — use get_test_cycle_folders for those.",
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
      .get(ENDPOINTS.TEST_CASE_FOLDERS(context.projectId), {
        sort: args.sort,
        withCount: args.withCount,
      });

    const validated: GetFoldersResponseType =
      GetFoldersResponse.parse(response);

    return { structuredContent: validated, content: [] };
  };
}
