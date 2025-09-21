import { describe, it, expect, beforeEach, afterEach } from "vitest";

// We import the module *lazily* inside each test so that we can control the
// OPENAI_API_KEY env var independently per test case. Node's module cache
// would otherwise capture the value present during the first import.

const ORIGINAL_ENV_KEY = process.env["OPENAI_API_KEY"];
const ORIGINAL_GROQ_KEY = process.env["GROQ_API_KEY"];

beforeEach(() => {
  delete process.env["OPENAI_API_KEY"];
  delete process.env["GROQ_API_KEY"];
});

afterEach(() => {
  if (ORIGINAL_ENV_KEY !== undefined) {
    process.env["OPENAI_API_KEY"] = ORIGINAL_ENV_KEY;
  } else {
    delete process.env["OPENAI_API_KEY"];
  }

  if (ORIGINAL_GROQ_KEY !== undefined) {
    process.env["GROQ_API_KEY"] = ORIGINAL_GROQ_KEY;
  } else {
    delete process.env["GROQ_API_KEY"];
  }
});

describe("config.setApiKey", () => {
  it("overrides the exported OPENAI_API_KEY at runtime", async () => {
    const { setApiKey, OPENAI_API_KEY } = await import(
      "../src/utils/config.js"
    );

    expect(OPENAI_API_KEY).toBe("");

    setApiKey("my‑key");

    const { OPENAI_API_KEY: liveRef } = await import("../src/utils/config.js");

    expect(liveRef).toBe("my‑key");
  });
});

it("setGroqApiKey updates the exported GROQ_API_KEY and env", async () => {
  const { setGroqApiKey, GROQ_API_KEY } = await import(
    "../src/utils/config.js"
  );

  expect(GROQ_API_KEY).toBe("");

  setGroqApiKey("groq-key");

  const { GROQ_API_KEY: liveGroq } = await import(
    "../src/utils/config.js"
  );

  expect(liveGroq).toBe("groq-key");
  expect(process.env["GROQ_API_KEY"]).toBe("groq-key");
});
