# @free-air/claude-code

<div align="center">

**Environment Configuration Switcher for Anthropic-Compatible AI Providers**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/%40free-air%2Fclaude-code.svg)](https://badge.fury.io/js/%40free-air%2Fclaude-code)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Commands](#commands) • [Configuration](#configuration) • [Troubleshooting](#troubleshooting)

</div>

---

## Features

🎯 **Easy Provider Switching** - Switch between AI providers (Kimi, GLM, Minimax, etc.) with a single command

🚀 **Zero Setup** - Automatic hook installation on npm install

🐚 **Cross-Shell Support** - Works with Bash, Zsh, Fish, PowerShell, and 5+ other shells

🔄 **Idempotent** - Safe to run multiple times, won't create duplicates

📦 **Lightweight** - Minimal dependencies, ~50KB total

✅ **Anthropic Compatible** - Supports any Anthropic API-compatible provider

## Quick Start

```bash
# Install globally
npm install -g @free-air/claude-code

# Initialize configuration file with examples
free init

# View available providers
free list

# Switch to a provider
free switch kimi

# See what's currently active
free current
```

## Installation

### Global (Recommended)

```bash
npm install -g @free-air/claude-code
```

The command `free` will be available in your shell. Hook installation is automatic.

### Local Development

```bash
npm install --save-dev @free-air/claude-code
npx free --help
```

### Manual Hook Installation

If automatic installation doesn't work:

```bash
free hook
```

Then open a new terminal or run:

```bash
source ~/.bashrc  # or ~/.zshrc, ~/.config/fish/config.fish, etc.
```

## Commands

### `free list`
List all available provider configurations.

```bash
$ free list
Available configurations:
  • kimi
  • glm
  • minimax
```

### `free current`
Show the currently active provider configuration.

```bash
$ free current
Current config: kimi
```

### `free switch <name>`
Switch to a provider and Load its environment variables.

```bash
$ free switch glm
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export ANTHROPIC_AUTH_TOKEN="your_zai_api_key"
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.6"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"
export FREE_CURRENT_CONFIG="glm"
[OK] Switched to config: glm
```

### `free init`
Create a template configuration file with example providers.

```bash
$ free init
[OK] Created example config file: /home/user/.free.json
Edit this file to add your own configurations and API keys.
```

### `free hook`
Manually install the hook function to your shell configuration.

```bash
$ free hook
[OK] Installed to /home/user/.bashrc
[OK] Installed to /home/user/.config/fish/config.fish
```

### `free remove`
Remove all hooks from shell configuration files.

```bash
$ free remove
[OK] Removed from bash: /home/user/.bashrc
[OK] Removed from zsh: /home/user/.zshrc
```

## Configuration

Configuration is stored in `~/.free.json` (JSON format).

### Configuration File Location

- **Linux/macOS**: `~/.free.json`
- **Windows**: `C:\Users\<YourUsername>\.free.json`

### Example Configuration

```json
{
  "kimi": {
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_moonshot_api_key",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k2.5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-k2.5",
    "ENABLE_TOOL_SEARCH": "false"
  },
  "glm": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_zai_api_key",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
  },
  "minimax": {
    "ANTHROPIC_BASE_URL": "https://api.minimax.chat/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_minimax_api_key",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-Text-01"
  }
}
```

### Adding a New Provider

Edit `~/.free.json` and add a new entry:

```json
{
  "my-provider": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_api_key",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "model-name",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "model-name"
  }
}
```

Then:

```bash
free switch my-provider
```

## Supported Shells

The tool automatically detects and supports:

| Shell | Config File | Status |
|-------|-------------|--------|
| Bash | `~/.bashrc`, `~/.bash_profile` | ✅ Supported |
| Zsh | `~/.zshrc` | ✅ Supported |
| Fish | `~/.config/fish/config.fish` | ✅ Supported |
| PowerShell | Multiple locations | ✅ Supported |
| Ksh | `~/.kshrc` | ✅ Supported |
| Tcsh | `~/.tcshrc` | ✅ Supported |
| Csh | `~/.cshrc` | ✅ Supported |
| Dash | `~/.dashrc` | ✅ Supported |
| Sh | `~/.profile` | ✅ Supported |

## How It Works

1. **Hook Installation**: On npm install, the tool automatically adds a function to your shell config file.

2. **Environment Variable Loading**: When you run `free switch <name>`, it outputs shell commands that set the environment variables.

3. **Shell Wrapper**: The hook function intercepts `free switch` and evaluates the output, making variables available in your current session.

4. **Idempotent**: The installation uses marker blocks to prevent duplicate entries.

## Usage Examples

### Switch between providers for different projects

```bash
# For Kimi project
free switch kimi

# For GLM project
free switch glm

# Back to default
free switch minimax
```

### Check current provider in a script

```bash
current_provider=$(echo $FREE_CURRENT_CONFIG)
echo "Using provider: $current_provider"
```

### Use with Claude CLI

```bash
# Switch provider
free switch kimi

# Run Claude commands (will use kimi's API endpoint)
claude chat "hello world"
```

### Use with LM Studio or other AI tools

```bash
free switch my-local-provider
# Tools configured to use ANTHROPIC_BASE_URL will now use your local provider
```

## Troubleshooting

### Command not found

**Problem**: `free: command not found`

**Solution**:
1. Verify npm installation: `npm list -g @free-air/claude-code`
2. Ensure npm bin directory is in PATH: `echo $PATH`
3. Reinstall: `npm install -g @free-air/claude-code`
4. Manually install hook: `free hook`

### Hook not loaded on new terminal

**Problem**: Hook isn't available after opening a new terminal

**Solution**:
1. Run `free hook` to reinstall
2. Open a new terminal window
3. For PowerShell: May require execution policy change

### Configuration file not found

**Problem**: `Failed to parse ~/.free.json`

**Solution**:
1. Create and initialize: `free init`
2. Verify JSON is valid: `cat ~/.free.json`
3. Use a JSON validator to check syntax

### Environment variables not set

**Problem**: After `free switch`, variables aren't available

**Solution**:
1. Verify you're using the wrapper: `type free` (bash/zsh) or `Get-Command free` (PowerShell)
2. Make sure hook was installed: `grep -n "free-env manager" ~/.bashrc`
3. Verify config exists: `cat ~/.free.json`
4. Reinstall hook: `free hook`

### Multiple shell profiles

**Problem**: Hook installed in wrong location

**Solution**: The tool checks multiple standard locations. You can manually add to additional profiles if needed:

```bash
# For bash
source ~/.bashrc

# For zsh
source ~/.zshrc

# For fish
source ~/.config/fish/config.fish
```

## Environment Variables

When you run `free switch kimi`, the tool sets:

- `FREE_CURRENT_CONFIG` - The active provider name
- All environment variables from the configuration

### Checking current provider

```bash
echo $FREE_CURRENT_CONFIG
```

## Uninstallation

```bash
# Remove globally
npm uninstall -g @free-air/claude-code

# Clean up shell config
free remove
```

## API Compatibility

This tool works with any provider that is compatible with the Anthropic API specification, including:

- **Moonshot AI** (Kimi)
- **Zhipu AI** (GLM) 
- **Minimax**
- Claude (Anthropic)
- Custom local providers

## Development

### Repository

```bash
git clone https://github.com/wusfe/switch-claude-model.git
cd switch-claude-model
npm install
npm run build
npm link
```

### Testing

```bash
free hook
free list
free switch kimi
free current
free remove
```

## License

MIT License - feel free to use in your projects!

## Author

**wusfe** - [GitHub](https://github.com/wusfe)

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/wusfe/switch-claude-model).

## Changelog

### v0.1.0 (2026-04-02)

- Initial release
- Support for 9 shell types (Bash, Zsh, Fish, PowerShell, Ksh, Tcsh, Csh, Dash, Sh)
- Automatic hook installation via npm postinstall
- Manual hook installation via `free hook` command
- Multi-file configuration support
- Idempotent block insertion/removal
freecc switch <provider>
freecc --help
```

Alias:

- `kim` -> `kimi`

## Examples

```bash
freecc list
freecc switch kim
freecc --help
```
