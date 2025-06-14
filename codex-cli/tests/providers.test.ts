import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies first
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    models: {
      list: vi.fn(),
    },
    responses: {
      create: vi.fn(),
    },
    beta: {
      chat: {
        completions: {
          parse: vi.fn(),
        },
      },
    },
  })),
}));

vi.mock("groq-sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    models: {
      list: vi.fn(),
    },
  })),
}));

vi.mock("../src/utils/config.js", () => ({
  OPENAI_BASE_URL: "https://api.openai.com/v1",
  OPENAI_TIMEOUT_MS: 30000,
  GROQ_BASE_URL: "https://api.groq.com/openai/v1",
  GROQ_TIMEOUT_MS: 30000,
  GROQ_API_KEY: "test-groq-key",
}));

vi.mock("../src/utils/session.js", () => ({
  CLI_VERSION: "1.0.0",
  getSessionId: () => "test-session-id",
  ORIGIN: "test-origin",
}));

vi.mock("../src/utils/providers/groq/GroqAdapterStream.js", () => ({
  GroqAdapterStream: vi.fn(),
}));

vi.mock("../src/utils/providers/groq/convertInputToMessages.js", () => ({
  convertInputToMessages: vi.fn(),
}));

vi.mock("../src/utils/singlepass/file_ops.js", () => ({
  EditedFilesSchema: {},
}));

import { OpenAIProvider } from "../src/utils/providers/openai-provider.js";
import { GroqProvider } from "../src/utils/providers/groq-provider.js";

describe("Provider Interface Implementation", () => {
  describe("OpenAIProvider", () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider();
    });

    it("should have createChatCompletion method", () => {
      expect(typeof provider.createChatCompletion).toBe("function");
    });

    it("should have createStream method", () => {
      expect(typeof provider.createStream).toBe("function");
    });

    it("should have listModels method", () => {
      expect(typeof provider.listModels).toBe("function");
    });
  });

  describe("GroqProvider", () => {
    let provider: GroqProvider;

    beforeEach(() => {
      provider = new GroqProvider();
    });

    it("should have createChatCompletion method", () => {
      expect(typeof provider.createChatCompletion).toBe("function");
    });

    it("should have createStream method", () => {
      expect(typeof provider.createStream).toBe("function");
    });

    it("should have listModels method", () => {
      expect(typeof provider.listModels).toBe("function");
    });
  });

  describe("Provider Interface Compliance", () => {
    it("should ensure both providers implement the same interface", () => {
      const openaiProvider = new OpenAIProvider();
      const groqProvider = new GroqProvider();

      // Check that both providers have the required methods
      expect(typeof openaiProvider.createChatCompletion).toBe("function");
      expect(typeof openaiProvider.createStream).toBe("function");
      expect(typeof openaiProvider.listModels).toBe("function");

      expect(typeof groqProvider.createChatCompletion).toBe("function");
      expect(typeof groqProvider.createStream).toBe("function");
      expect(typeof groqProvider.listModels).toBe("function");
    });
  });
}); 