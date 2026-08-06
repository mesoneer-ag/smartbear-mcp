import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS, TOOLSETS } from "../../config/constants";
import { GetTestCaseFolders } from "./get-test-case-folders";

describe("GetTestCaseFolders", () => {
  let mockClient: any;
  let mockApiClient: any;
  let mockRegistry: any;
  let instance: GetTestCaseFolders;

  const mockContext = {
    projectKey: "PROJ",
    projectId: 10066,
    projectName: "Test Project",
  };

  const mockResponse = {
    total: 2,
    data: [
      {
        id: 108464,
        name: "Login Test",
        seqNo: 1,
        created: {
          createdOn: "20/Dec/2019 06:41",
          createdBy: "5a7002fe8cb39d5510842a7f",
        },
        updated: {
          updatedOn: "20/Dec/2019 06:41",
          updatedBy: "5a7002fe8cb39d5510842a7f",
        },
        children: [],
      },
      {
        id: 108468,
        name: "Products",
        seqNo: 2,
        children: [{ id: 108470, name: "Checkout", seqNo: 1, children: [] }],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRegistry = {
      requireProjectContext: vi.fn().mockReturnValue(mockContext),
    };
    mockApiClient = { get: vi.fn() };
    mockClient = {
      getApiClient: vi.fn().mockReturnValue(mockApiClient),
      getResolverRegistry: vi.fn().mockReturnValue(mockRegistry),
    };

    instance = new GetTestCaseFolders(mockClient as any);
  });

  describe("specification", () => {
    it("should have correct tool metadata", () => {
      expect(instance.specification.title).toBe("Get Test Case Folders");
      expect(instance.specification.toolset).toBe(TOOLSETS.TEST_CASES);
      expect(instance.specification.readOnly).toBe(true);
      expect(instance.specification.idempotent).toBe(true);
      expect(instance.specification.inputSchema).toBeDefined();
      expect(instance.specification.outputSchema).toBeDefined();
    });

    it("should have use cases, examples, and hints", () => {
      expect(instance.specification.useCases?.length).toBeGreaterThan(0);
      expect(instance.specification.examples?.length).toBeGreaterThan(0);
      expect(instance.specification.hints?.length).toBeGreaterThan(0);
    });
  });

  describe("handle", () => {
    it("should GET the test case folders endpoint for the active project", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await instance.handle({});

      expect(mockApiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.TEST_CASE_FOLDERS(10066),
        { sort: undefined, withCount: undefined },
      );
      expect(result.structuredContent).toStrictEqual(mockResponse);
    });

    it("should pass sort and withCount as query params", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await instance.handle({ sort: "NAME:asc", withCount: true });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.TEST_CASE_FOLDERS(10066),
        { sort: "NAME:asc", withCount: true },
      );
    });

    it("should pass withCount false through instead of dropping it", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await instance.handle({ withCount: false });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.TEST_CASE_FOLDERS(10066),
        { sort: undefined, withCount: false },
      );
    });

    it("should return nested children unchanged", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await instance.handle({});

      expect((result.structuredContent as any).data[1].children).toStrictEqual([
        { id: 108470, name: "Checkout", seqNo: 1, children: [] },
      ]);
    });

    it("should keep folder counts when withCount is requested", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        total: 1,
        data: [
          {
            id: 108464,
            name: "Login Test",
            selfCount: 3,
            totalCount: 7,
            children: [],
          },
        ],
      });

      const result = await instance.handle({ withCount: true });

      expect((result.structuredContent as any).data[0]).toMatchObject({
        selfCount: 3,
        totalCount: 7,
      });
    });

    it("should require project context", async () => {
      mockRegistry.requireProjectContext.mockImplementationOnce(() => {
        throw new Error("No active project context");
      });

      await expect(instance.handle({})).rejects.toThrow(
        "No active project context",
      );
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it("should propagate API errors", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("API error"));

      await expect(instance.handle({})).rejects.toThrow("API error");
    });

    it("should reject a response that does not match the schema", async () => {
      mockApiClient.get.mockResolvedValueOnce({ total: 1 });

      await expect(instance.handle({})).rejects.toThrow();
    });
  });
});
