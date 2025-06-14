<h1 align="center">Open Codex - Multi-LLM CLI</h1>
<p align="center">Lightweight coding agent that runs in your terminal with support for multiple LLM providers</p>

<p align="center">🚀 <strong>Fork of OpenAI Codex CLI with Multi-LLM Support</strong> 🚀</p>

![Codex demo GIF using: codex "explain this codebase to me"](./.github/demo.gif)

---

<details>
<summary><strong>Table&nbsp;of&nbsp;Contents</strong></summary>

- [About this Fork](#about-this-fork)
- [Supported LLM Providers](#supported-llm-providers)
- [Experimental Technology Disclaimer](#experimental-technology-disclaimer)
- [Quickstart](#quickstart)
- [Why Open Codex?](#why-open-codex)
- [Security Model \& Permissions](#security-model--permissions)
  - [Platform sandboxing details](#platform-sandboxing-details)
- [System Requirements](#system-requirements)
- [CLI Reference](#cli-reference)
- [Memory \& Project Docs](#memory--project-docs)
- [Non‑interactive / CI mode](#noninteractive--ci-mode)
- [Recipes](#recipes)
- [Installation](#installation)
- [Configuration](#configuration)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
  - [Development workflow](#development-workflow)
    - [Nix Flake Development](#nix-flake-development)
  - [Writing high‑impact code changes](#writing-highimpact-code-changes)
  - [Opening a pull request](#opening-a-pull-request)
  - [Review process](#review-process)
  - [Community values](#community-values)
  - [Getting help](#getting-help)
- [Security \& Responsible AI](#security--responsible-ai)
- [License](#license)

</details>

---

## About this Fork

**Open Codex** is a community-driven fork of OpenAI's Codex CLI that extends support to multiple LLM providers. While the original Codex CLI is limited to OpenAI models, this fork introduces a **provider-agnostic architecture** that allows you to use various AI models from different providers.

### Key Differences from Original
- 🔌 **Multi-provider support**: OpenAI, Groq, and more coming soon
- 🏗️ **Extensible architecture**: Easy to add new LLM providers
- 🌍 **Community-driven**: Open for contributions and new provider integrations
- 🚀 **Enhanced flexibility**: Choose the best model for your specific needs

## Supported LLM Providers

| Provider | Status | Models | API Key Required |
|----------|---------|---------|------------------|
| **OpenAI** | ✅ Stable | GPT-4, GPT-3.5, o1, o4-mini, etc. | `OPENAI_API_KEY` |
| **Groq** | ✅ Stable | Llama, Mixtral, Gemma | `GROQ_API_KEY` |
| **Anthropic** | 🔄 Coming Soon | Claude 3.5 Sonnet, Haiku | `ANTHROPIC_API_KEY` |
| **Google** | 🔄 Planned | Gemini Pro, PaLM | `GOOGLE_API_KEY` |
| **Ollama** | 🔄 Planned | Local models | N/A |

## Experimental Technology Disclaimer

Open Codex is an experimental project under active development. It is not yet stable, may contain bugs, incomplete features, or undergo breaking changes. We're building it in the open with the community and welcome:

- Bug reports
- Feature requests
- Pull requests
- Provider integrations
- Good vibes

Help us improve by filing issues or submitting PRs!

## Quickstart

### Installation

Since this is a fork in active development and not yet published to npm, you'll need to clone and build from source:

```shell
# Clone the repository
git clone https://github.com/your-username/open-codex.git
cd open-codex

# Install dependencies
npm install

# Build the CLI
cd codex-cli
npm run build

# Link globally (optional)
npm link
```

### Setup API Keys

Create a `.env` file in the project root with your API keys:

```env
# Choose your preferred provider
OPENAI_API_KEY=your-openai-key-here
GROQ_API_KEY=your-groq-key-here
# Add more providers as they become available
```

### Run the CLI

```shell
# If you linked globally
codex

# Or run directly from the build
node codex-cli/dist/cli.js

# With a specific provider (coming soon)
codex --provider groq "explain this codebase to me"
```

Or run with a prompt as input (and optionally in `Full Auto` mode):

```shell
codex "explain this codebase to me"
codex --approval-mode full-auto "create the fanciest todo-list app"
```

---

## Why Open Codex?

Open Codex builds upon the foundation of OpenAI's Codex CLI but extends it to be **provider-agnostic** and **community-driven**. It's built for developers who want:

- **Choice in AI models**: Use the best model for each specific task
- **Cost optimization**: Switch between providers based on pricing
- **Reduced vendor lock-in**: Not tied to a single AI provider
- **Terminal-native workflow**: All the power of the original Codex CLI
- **Community contributions**: Open ecosystem for new providers and features

Key features:
- **Zero setup after clone** — add your API keys and it just works!
- **Full auto-approval, while safe + secure** by running network-disabled and directory-sandboxed
- **Multimodal** — pass in screenshots or diagrams to implement features ✨
- **Provider flexibility** — switch between AI providers based on your needs

---

## Security Model & Permissions

Open Codex maintains the same security model as the original Codex CLI. You decide _how much autonomy_ the agent receives via the `--approval-mode` flag:

| Mode                      | What the agent may do without asking                                                               | Still requires approval                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Suggest** <br>(default) | • Read any file in the repo                                                                        | • **All** file writes/patches <br>• **Any** arbitrary shell commands (aside from reading files) |
| **Auto Edit**             | • Read **and** apply‑patch writes to files                                                         | • **All** shell commands                                                                        |
| **Full Auto**             | • Read/write files <br>• Execute shell commands (network disabled, writes limited to your workdir) | –                                                                                               |

In **Full Auto** every command is run **network‑disabled** and confined to the current working directory for defense‑in‑depth.

### Platform sandboxing details

The hardening mechanism depends on your OS:

- **macOS 12+** – commands are wrapped with **Apple Seatbelt** (`sandbox-exec`)
- **Linux** – use Docker for sandboxing with the included [`run_in_container.sh`](./codex-cli/scripts/run_in_container.sh) script

---

## System Requirements

| Requirement                 | Details                                                         |
| --------------------------- | --------------------------------------------------------------- |
| Operating systems           | macOS 12+, Ubuntu 20.04+/Debian 10+, or Windows 11 **via WSL2** |
| Node.js                     | **22 or newer** (LTS recommended)                               |
| Git (optional, recommended) | 2.23+ for built‑in PR helpers                                   |
| RAM                         | 4‑GB minimum (8‑GB recommended)                                 |

---

## CLI Reference

| Command                              | Purpose                             | Example                              |
| ------------------------------------ | ----------------------------------- | ------------------------------------ |
| `codex`                              | Interactive REPL                    | `codex`                              |
| `codex "…"`                          | Initial prompt for interactive REPL | `codex "fix lint errors"`            |
| `codex -q "…"`                       | Non‑interactive "quiet mode"        | `codex -q --json "explain utils.ts"` |
| `codex --provider <name>`            | Use specific provider               | `codex --provider groq "help me"`    |
| `codex completion <bash\|zsh\|fish>` | Print shell completion script       | `codex completion bash`              |

Key flags: `--model/-m`, `--provider/-p`, `--approval-mode/-a`, `--quiet/-q`, and `--notify`.

---

## Memory & Project Docs

Open Codex merges Markdown instructions in this order:

1. `~/.codex/instructions.md` – personal global guidance
2. `codex.md` at repo root – shared project notes
3. `codex.md` in cwd – sub‑package specifics

Disable with `--no-project-doc` or `CODEX_DISABLE_PROJECT_DOC=1`.

---

## Non‑interactive / CI mode

Run Open Codex head‑less in pipelines. Example GitHub Action step:

```yaml
- name: Update changelog via Open Codex
  run: |
    git clone https://github.com/your-username/open-codex.git
    cd open-codex && npm install && cd codex-cli && npm run build
    export OPENAI_API_KEY="${{ secrets.OPENAI_KEY }}"
    node dist/cli.js -a auto-edit --quiet "update CHANGELOG for next release"
```

Set `CODEX_QUIET_MODE=1` to silence interactive UI noise.

## Tracing / Verbose Logging

Setting the environment variable `DEBUG=true` prints full API request and response details:

```shell
DEBUG=true codex
```

---

## Recipes

Below are a few bite‑size examples you can copy‑paste. Replace the text in quotes with your own task.

| ✨  | What you type                                                                   | What happens                                                               |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | `codex "Refactor the Dashboard component to React Hooks"`                       | Codex rewrites the class component, runs `npm test`, and shows the diff.   |
| 2   | `codex --provider groq "Generate SQL migrations for adding a users table"`      | Uses Groq to infer your ORM and creates migration files.                  |
| 3   | `codex "Write unit tests for utils/date.ts"`                                    | Generates tests, executes them, and iterates until they pass.              |
| 4   | `codex "Bulk‑rename *.jpeg → *.jpg with git mv"`                                | Safely renames files and updates imports/usages.                           |
| 5   | `codex --provider openai "Explain what this regex does: ^(?=.*[A-Z]).{8,}$"`   | Uses OpenAI to output a step‑by‑step human explanation.                   |
| 6   | `codex "Review this repo and propose 3 high impact PRs"`                        | Suggests impactful PRs in the current codebase.                            |
| 7   | `codex "Look for vulnerabilities and create a security review report"`          | Finds and explains security bugs.                                          |

---

## Installation

<details open>
<summary><strong>From Source (Required - No npm package yet)</strong></summary>

```bash
# Clone the repository
git clone https://github.com/your-username/open-codex.git
cd open-codex

# Install dependencies
npm install

# Build the CLI
cd codex-cli
npm install
npm run build

# Test the build
node dist/cli.js --help

# Link globally for convenience (optional)
npm link
```

</details>

<details>
<summary><strong>Development Build</strong></summary>

```bash
# Clone and navigate
git clone https://github.com/your-username/open-codex.git
cd open-codex/codex-cli

# Install and build in development mode
npm install
npm run build:dev

# Run with development options
npm run dev
```

</details>

---

## Configuration

Open Codex looks for config files in **`~/.codex/`**.

```yaml
# ~/.codex/config.yaml
model: gpt-4o-mini # Default model
provider: openai # Default provider (openai, groq)
fullAutoErrorMode: ask-user # or ignore-and-continue
notify: true # Enable desktop notifications for responses
```

You can also define custom instructions:

```yaml
# ~/.codex/instructions.md
- Always respond with emojis
- Only use git commands if I explicitly mention you should
- Prefer Groq for simple tasks, OpenAI for complex reasoning
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Provider API Keys
OPENAI_API_KEY=your-openai-key-here
GROQ_API_KEY=your-groq-key-here

# Optional: Default provider
DEFAULT_PROVIDER=openai

# Optional: Debug mode
DEBUG=false
```

---

## Roadmap

Based on the current development tasks and community needs, here's our roadmap:

### 🔥 Current Sprint (In Progress)
- ✅ **Core Provider System** - OpenAI and Groq providers implemented
- ✅ **Provider Interface** - Standardized interface for all providers
- ✅ **Refactored Architecture** - Removed hardcoded OpenAI dependencies
- 🔄 **Testing & Validation** - Comprehensive testing of provider system
- 🔄 **Performance Monitoring** - Memory usage and response time optimization

### 🚀 Next Release (v0.2.0)
- **Provider Selection** - CLI flag to choose provider per command
- **Anthropic Claude Support** - Integration with Claude 3.5 Sonnet
- **Enhanced Documentation** - Complete API documentation and examples
- **Configuration System** - Improved config management and provider defaults
- **Error Handling** - Better error messages and fallback mechanisms

### 🎯 Short Term (Q2 2024)
- **Google Gemini Integration** - Support for Gemini Pro models
- **Ollama Support** - Local model execution via Ollama
- **Provider-Specific Features** - Leverage unique capabilities of each provider
- **Cost Tracking** - Monitor API usage and costs across providers
- **Model Recommendations** - Suggest best model for specific tasks

### 🔮 Medium Term (Q3-Q4 2024)
- **Streaming Improvements** - Enhanced real-time response streaming
- **Multi-Provider Workflows** - Use different providers for different tasks
- **Custom Provider API** - Easy integration of new providers
- **Performance Benchmarks** - Provider comparison and optimization
- **Team Collaboration** - Shared configurations and provider pools

### 🌟 Long Term Vision
- **Plugin System** - Extensible architecture for community plugins
- **Model Fine-tuning** - Integration with custom fine-tuned models
- **Enterprise Features** - SSO, audit logs, and enterprise provider support
- **AI Model Router** - Intelligent routing based on task complexity
- **Unified Billing** - Consolidated billing across all providers

### 📊 Technical Debt & Infrastructure
- **Test Coverage** - Achieve 90%+ test coverage
- **CI/CD Pipeline** - Automated testing and deployment
- **npm Publishing** - Regular releases to npm registry
- **Documentation Site** - Comprehensive documentation website
- **Community Tools** - Issue templates, contribution guides

---

## Contributing

This is an open-source, community-driven project! We welcome contributions of all kinds:

### Ways to Contribute
- 🐛 **Bug Reports** - Help us identify and fix issues
- 💡 **Feature Requests** - Suggest new capabilities
- 🔌 **Provider Integration** - Add support for new LLM providers
- 📖 **Documentation** - Improve guides and examples
- 🧪 **Testing** - Help with test coverage and validation
- 💻 **Code** - Implement features and fix bugs

### Development workflow

- Create a _topic branch_ from `main` – e.g. `feat/anthropic-provider`
- Keep your changes focused. Multiple unrelated fixes should be opened as separate PRs
- Use `npm run test:watch` during development for super‑fast feedback
- We use **Vitest** for unit tests, **ESLint** + **Prettier** for style, and **TypeScript** for type‑checking
- Before pushing, run the full test/type/lint suite:

```bash
npm test && npm run lint && npm run typecheck
```

### Adding a New Provider

1. Create a new provider class implementing `ProviderInterface`
2. Add the provider to `LLMProviderType` enum
3. Update the provider factory in `get-provider.ts`
4. Add comprehensive tests
5. Update documentation and examples

Example provider structure:
```typescript
// src/utils/providers/my-provider.ts
export class MyProvider implements ProviderInterface {
  async listModels(): Promise<any> { /* implementation */ }
  async createStream(params: any): Promise<any> { /* implementation */ }
  async createChatCompletion(params: any): Promise<string> { /* implementation */ }
}
```

### Git Hooks with Husky

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality checks:
- **Pre-commit hook**: Automatically runs lint-staged to format and lint files
- **Pre-push hook**: Runs tests and type checking before pushing

### Opening a pull request

- Fill in the PR template – **What? Why? How?**
- Run **all** checks locally (`npm test && npm run lint && npm run typecheck`)
- Make sure your branch is up‑to‑date with `main`
- Mark the PR as **Ready for review** only when it's in a merge‑able state

### Community values

- **Be kind and inclusive** - Treat others with respect
- **Assume good intent** - Written communication is hard
- **Teach & learn** - Help others and ask questions
- **Provider neutrality** - No bias towards specific AI providers

---

## Security &amp; Responsible AI

Have you discovered a vulnerability or have concerns about model output? Please create an issue or contact the maintainers.

We're committed to:
- **Secure by default** - Sandboxed execution and permission controls
- **Privacy-first** - No data collection beyond what's needed for functionality
- **Provider transparency** - Clear documentation of data usage by each provider
- **Responsible AI** - Guidelines for ethical AI usage

---

## License

This repository is licensed under the [Apache-2.0 License](LICENSE), same as the original OpenAI Codex CLI.

---

<p align="center">
  <strong>⭐ Star this repo if you find it useful!</strong><br>
  <em>Built with ❤️ by the open-source community</em>
</p>
