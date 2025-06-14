# Open Codex - Frequently Asked Questions

## General Questions

### What is Open Codex?
Open Codex is a community-driven fork of OpenAI's Codex CLI that extends support to multiple LLM providers. While the original Codex CLI only works with OpenAI models, Open Codex allows you to use various AI models from different providers like OpenAI, Groq, Anthropic (coming soon), and more.

### How is this different from the original OpenAI Codex CLI?
- **Multi-provider support**: Use OpenAI, Groq, and more providers
- **Provider flexibility**: Choose the best model for each specific task
- **Cost optimization**: Switch between providers based on pricing
- **Community-driven**: Open for contributions and new provider integrations
- **No vendor lock-in**: Not tied to a single AI provider

### Is this project officially affiliated with OpenAI?
No, Open Codex is an independent, community-driven fork. While we maintain the same Apache-2.0 license and respect the original work, this is not an official OpenAI product.

## Installation & Setup

### Why can't I install this via npm like the original?
Open Codex is currently in active development and not yet published to npm. You need to clone and build from source. We plan to publish to npm once we reach stability in v0.2.0.

### How do I install Open Codex?
```bash
# Clone the repository
git clone https://github.com/your-username/open-codex.git
cd open-codex

# Install dependencies and build
npm install
cd codex-cli
npm run build

# Link globally (optional)
npm link
```

### What Node.js version do I need?
Node.js 22 or newer is required, just like the original Codex CLI.

### How do I set up API keys for multiple providers?
Create a `.env` file in the project root:
```env
OPENAI_API_KEY=your-openai-key-here
GROQ_API_KEY=your-groq-key-here
# Add more providers as they become available
```

### Can I use Open Codex without any API keys?
Not currently, but we're working on Ollama support which will allow you to run local models without API keys.

## Provider Support

### Which providers are currently supported?
- **OpenAI** ✅ (GPT-4, GPT-3.5, o1, o4-mini, etc.)
- **Groq** ✅ (Llama, Mixtral, Gemma)
- **Anthropic** 🔄 Coming soon (Claude 3.5 Sonnet, Haiku)
- **Google** 🔄 Planned (Gemini Pro, PaLM)
- **Ollama** 🔄 Planned (Local models)

### How do I choose which provider to use?
Currently, the provider is selected automatically based on your configuration. In v0.2.0, we'll add a `--provider` flag:
```bash
codex --provider groq "explain this function"
codex --provider openai "write complex algorithm"
```

### Can I use multiple providers in the same session?
Not yet, but this is planned for future releases. We're working on multi-provider workflows where you can use different providers for different tasks within the same session.

### Which provider should I use for what tasks?
- **OpenAI**: Best for complex reasoning, code generation, and general tasks
- **Groq**: Excellent for fast responses and simple to medium complexity tasks
- **Anthropic (coming)**: Great for large context and ethical AI reasoning
- **Local models (coming)**: Perfect for privacy-sensitive tasks and offline work

### How do costs compare between providers?
Costs vary significantly between providers. Groq tends to be more cost-effective for many tasks, while OpenAI offers premium models with advanced capabilities. We're working on cost tracking features to help you optimize usage.

## Features & Functionality

### Does Open Codex support all the features of the original?
Yes! Open Codex maintains full compatibility with the original Codex CLI features while adding multi-provider support. All approval modes, security features, and core functionality work the same way.

### Can I still use the original OpenAI-only features?
Absolutely. When using the OpenAI provider, you get all the same features as the original Codex CLI.

### Does the security model change with multiple providers?
No, the security model remains the same. All providers run within the same sandbox restrictions and approval modes for your safety.

### Do all providers support streaming responses?
Yes, all providers implement streaming responses, though the specific implementation may vary slightly between providers.

## Troubleshooting

### I'm getting "Provider not found" errors
Make sure you have the correct API key set in your `.env` file for the provider you're trying to use. Check that the provider name is spelled correctly.

### The CLI is not finding my .env file
Make sure your `.env` file is in the project root directory (the same directory where you cloned Open Codex), not in the `codex-cli` subdirectory.

### Response quality seems different between providers
Different providers have different strengths. Try adjusting your prompts or switching providers for specific types of tasks. Some providers work better with more detailed prompts, while others prefer concise requests.

### I'm getting rate limit errors
Each provider has different rate limits. Try switching to a different provider or adding delays between requests. We're working on automatic rate limit handling in future versions.

### The build process fails
Make sure you have:
- Node.js 22 or newer
- Run `npm install` in the root directory first
- Then `cd codex-cli && npm install && npm run build`

## Development & Contributing

### How can I contribute to Open Codex?
We welcome contributions! You can:
- Report bugs and issues
- Suggest new features
- Add support for new providers
- Improve documentation
- Help with testing

See our [Contributing Guide](CONTRIBUTING.md) for detailed instructions.

### How do I add support for a new provider?
1. Create a new provider class implementing `ProviderInterface`
2. Add the provider to `LLMProviderType` enum
3. Update the provider factory in `get-provider.ts`
4. Add comprehensive tests
5. Update documentation

See the [Roadmap](ROADMAP.md) for detailed provider integration guidelines.

### Can I use Open Codex in my commercial project?
Yes! Open Codex uses the same Apache-2.0 license as the original Codex CLI, which allows commercial use.

### How stable is Open Codex?
We're currently in active development (pre-v0.2.0). The core functionality is stable, but we're still working on comprehensive testing and additional features. We recommend using it for non-critical projects until v0.2.0.

## Future Plans

### When will you publish to npm?
We plan to publish to npm with v0.2.0, targeted for Q1 2025, once we complete comprehensive testing and stabilization.

### What's the long-term vision for Open Codex?
We envision Open Codex becoming the go-to multi-provider AI coding assistant with features like:
- Intelligent provider routing
- Cost optimization
- Team collaboration features
- Enterprise support
- Plugin ecosystem

See our detailed [Roadmap](ROADMAP.md) for more information.

### Will you maintain compatibility with the original Codex CLI?
Yes, maintaining compatibility is a core principle. Users should be able to migrate from the original Codex CLI to Open Codex without changing their workflow.

## Privacy & Security

### Do you collect any usage data?
No, Open Codex doesn't collect usage data. Your interactions go directly to your chosen AI provider according to their respective privacy policies.

### Which provider should I use for sensitive code?
For maximum privacy, we recommend waiting for Ollama support (coming soon) which will allow you to run models locally. Among API providers, check each provider's privacy policy to make an informed decision.

### Are my API keys secure?
Your API keys are stored locally in your `.env` file and are never transmitted to anyone except the respective AI providers. Make sure to keep your `.env` file secure and never commit it to version control.

---

## Getting Help

If you don't find your question answered here:

1. **Check the [README](README.md)** for basic setup and usage
2. **Review the [Roadmap](ROADMAP.md)** for planned features
3. **Search existing [Issues](https://github.com/your-username/open-codex/issues)** on GitHub
4. **Open a new issue** if you can't find an answer
5. **Join the discussion** in GitHub Discussions

---

*This FAQ is updated regularly. Last updated: January 2025* 