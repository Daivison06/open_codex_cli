import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateChatCompletion } from "../src/utils/llm-provider.js";

// Mock the get-provider module
vi.mock("../src/utils/get-provider.js", () => ({
  getModelProvider: vi.fn(),
}));

describe("generateChatCompletion (Refactored)", () => {
  let mockProvider: any;
  let getModelProvider: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Create mock provider
    mockProvider = {
      createChatCompletion: vi.fn(),
    };

    // Mock getModelProvider to return our mock
    getModelProvider = vi.mocked(await import("../src/utils/get-provider.js")).getModelProvider;
    getModelProvider.mockReturnValue(mockProvider);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call provider.createChatCompletion with correct parameters", async () => {
    const mockResponse = "Test response from provider";
    mockProvider.createChatCompletion.mockResolvedValue(mockResponse);

    const messages = [
      { role: "system", content: "You are a helpful assistant" },
      { role: "user", content: "Hello, how are you?" },
    ];
    const model = "gpt-4";

    const result = await generateChatCompletion({ messages, model });

    expect(result).toBe(mockResponse);
    expect(getModelProvider).toHaveBeenCalledOnce();
    expect(mockProvider.createChatCompletion).toHaveBeenCalledWith({
      model,
      messages,
    });
  });

  it("should work with different message types", async () => {
    const mockResponse = "Response for different messages";
    mockProvider.createChatCompletion.mockResolvedValue(mockResponse);

    const messages = [
      { role: "user", content: "What is the weather?" },
      { role: "assistant", content: "I need more information" },
      { role: "user", content: "In New York" },
    ];
    const model = "llama-3.3-70b-versatile";

    const result = await generateChatCompletion({ messages, model });

    expect(result).toBe(mockResponse);
    expect(mockProvider.createChatCompletion).toHaveBeenCalledWith({
      model,
      messages,
    });
  });

  it("should handle provider errors gracefully", async () => {
    const mockError = new Error("Provider API error");
    mockProvider.createChatCompletion.mockRejectedValue(mockError);

    const messages = [{ role: "user", content: "Test" }];
    const model = "gpt-4";

    await expect(
      generateChatCompletion({ messages, model })
    ).rejects.toThrow("Provider API error");

    expect(getModelProvider).toHaveBeenCalledOnce();
    expect(mockProvider.createChatCompletion).toHaveBeenCalledWith({
      model,
      messages,
    });
  });

  it("should handle getModelProvider errors", async () => {
    const mockError = new Error("No provider configured");
    getModelProvider.mockImplementation(() => {
      throw mockError;
    });

    const messages = [{ role: "user", content: "Test" }];
    const model = "gpt-4";

    await expect(
      generateChatCompletion({ messages, model })
    ).rejects.toThrow("No provider configured");

    expect(getModelProvider).toHaveBeenCalledOnce();
    expect(mockProvider.createChatCompletion).not.toHaveBeenCalled();
  });

  it("should work with empty messages array", async () => {
    const mockResponse = "Empty response";
    mockProvider.createChatCompletion.mockResolvedValue(mockResponse);

    const messages: Array<{ role: string; content: string }> = [];
    const model = "gpt-4";

    const result = await generateChatCompletion({ messages, model });

    expect(result).toBe(mockResponse);
    expect(mockProvider.createChatCompletion).toHaveBeenCalledWith({
      model,
      messages: [],
    });
  });

  it("should work with different models", async () => {
    const testCases = [
      { model: "gpt-4", response: "GPT-4 response" },
      { model: "llama-3.3-70b-versatile", response: "Groq response" },
      { model: "gpt-3.5-turbo", response: "GPT-3.5 response" },
    ];

    for (const testCase of testCases) {
      mockProvider.createChatCompletion.mockResolvedValue(testCase.response);

      const result = await generateChatCompletion({
        messages: [{ role: "user", content: "test" }],
        model: testCase.model,
      });

      expect(result).toBe(testCase.response);
    }

    expect(mockProvider.createChatCompletion).toHaveBeenCalledTimes(testCases.length);
  });

  it("should maintain backward compatibility with existing interface", async () => {
    // This test ensures that the refactored function maintains the same API
    const mockResponse = "Backward compatible response";
    mockProvider.createChatCompletion.mockResolvedValue(mockResponse);

    // Test the exact interface that was used before refactoring
    const result = await generateChatCompletion({
      messages: [
        { role: "user", content: "Hello" },
      ],
      model: "gpt-4",
    });

    expect(typeof result).toBe("string");
    expect(result).toBe(mockResponse);
  });
}); 