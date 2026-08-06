import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS, TOOLSETS } from "../../config/constants";
import { GetTestCycleFolders } from "./get-test-cycle-folders";

describe("GetTestCycleFolders", () => {
  let mockClient: any;
  let mockApiClient: any;
  let mockRegistry: any;
  let instance: GetTestCycleFolders;

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
        name: "Sprint 41",
        seqNo: 1,
        children: [],
      },
      {
        id: 108468,
        name: "Releases",
        seqNo: 2,
        children: [{ id: 108471, name: "2026", seqNo: 1, children: [] }],
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

    instance = new GetTestCycleFolders(mockClient as any);
  });

  describe("specification", () => {
    it("should have correct tool metadata", () => {
      expect(instance.specification.title).toBe("Get Test Cycle Folders");
      expect(instance.specification.toolset).toBe(TOOLSETS.TEST_CYCLES);
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
    it("should GET the test cycle folders endpoint for the active project", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await instance.handle({});

      expect(mockApiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.TEST_CYCLE_FOLDERS(10066),
        { sort: undefined, withCount: undefined },
      );
      expect(result.structuredContent).toStrictEqual(mockResponse);
    });

    it("should pass sort and withCount as query params", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await instance.handle({ sort: "NAME:desc", withCount: true });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.TEST_CYCLE_FOLDERS(10066),
        { sort: "NAME:desc", withCount: true },
      );
    });

    it("should not hit the test case folders endpoint", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await instance.handle({});

      expect(mockApiClient.get).not.toHaveBeenCalledWith(
        ENDPOINTS.TEST_CASE_FOLDERS(10066),
        expect.anything(),
      );
    });

    it("should return nested children unchanged", async () => {
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await instance.handle({});

      expect((result.structuredContent as any).data[1].children).toStrictEqual([
        { id: 108471, name: "2026", seqNo: 1, children: [] },
      ]);
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
      mockApiClient.get.mockResolvedValueOnce({ data: [] });

      await expect(instance.handle({})).rejects.toThrow();
    });
  });
});
