/**
 * QTM4J Folder Schemas
 *
 * GET /rest/api/latest/projects/{projectId}/testcase-folders
 * GET /rest/api/latest/projects/{projectId}/testcycle-folders
 *
 * Both endpoints share the same request and response shape, so a single pair of
 * schemas covers test case and test cycle folders.
 * projectId comes from the active project context — never passed by the LLM.
 */
import * as zod from "zod";

/** Fields the folder endpoints accept in the `sort` query param. */
export const FOLDER_SORT_FIELDS = ["NAME", "CREATED_ON", "UPDATED_ON"] as const;

export const GetFoldersBody = zod.object({
  sort: zod
    .string()
    .optional()
    .describe(
      `Sort pattern sent as a URL query param. Format: 'field:order'. ` +
        `Sortable fields: ${FOLDER_SORT_FIELDS.join(", ")}. ` +
        "Order values: 'asc' or 'desc'. Example: 'NAME:asc'. " +
        "Omit to keep the folder order configured in QTM4J (seqNo).",
    ),
  withCount: zod
    .boolean()
    .optional()
    .describe(
      "Set to true to include the number of items in each folder: selfCount (directly in the folder) " +
        "and totalCount (including all subfolders). Omit when only IDs and names are needed.",
    ),
});

export type GetFoldersBodyType = zod.infer<typeof GetFoldersBody>;

const FolderAuditSchema = zod.looseObject({
  createdOn: zod
    .string()
    .optional()
    .describe("Creation timestamp e.g. '20/Dec/2019 06:41'"),
  createdBy: zod.string().optional().describe("Jira account ID of the creator"),
  updatedOn: zod.string().optional().describe("Last-updated timestamp"),
  updatedBy: zod.string().optional().describe("Jira account ID of the updater"),
});

export const FolderSchema = zod.looseObject({
  id: zod
    .number()
    .describe(
      "Numeric folder ID. This is the value to pass as folderId to other tools.",
    ),
  name: zod
    .string()
    .describe("Folder name as shown in QTM4J (not unique across the tree)"),
  seqNo: zod
    .number()
    .nullable()
    .optional()
    .describe("Position of the folder among its siblings in QTM4J"),
  created: FolderAuditSchema.nullable().optional(),
  updated: FolderAuditSchema.nullable().optional(),
  selfCount: zod
    .number()
    .nullable()
    .optional()
    .describe(
      "Number of items directly in this folder. Only returned when withCount is true.",
    ),
  totalCount: zod
    .number()
    .nullable()
    .optional()
    .describe(
      "Number of items in this folder and all its subfolders. Only returned when withCount is true.",
    ),
  children: zod
    .array(zod.any())
    .nullable()
    .optional()
    .describe(
      "Subfolders, each with the same shape as this object (the structure is recursive). " +
        "An empty array means the folder has no subfolders.",
    ),
});

export const GetFoldersResponse = zod.object({
  total: zod.number().describe("Number of root-level folders returned"),
  data: zod
    .array(FolderSchema)
    .describe(
      "Root-level folders of the project. Subfolders are nested under each folder's `children` array.",
    ),
});

export type GetFoldersResponseType = zod.infer<typeof GetFoldersResponse>;
