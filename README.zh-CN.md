# @free-air/claude-code

English | [中文 (Chinese)](README.zh-CN.md)

<div align="center">

**适配 Anthropic 兼容 AI 提供商的环境配置快速切换工具**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm 版本](https://badge.fury.io/js/%40free-air%2Fclaude-code.svg)](https://badge.fury.io/js/%40free-air%2Fclaude-code)

[特性](#特性) • [安装](#安装) • [快速开始](#快速开始) • [命令](#命令) • [配置](#配置) • [故障排除](#故障排除)

</div>

---

## 特性

🎯 **便捷切换提供商** - 一条命令即可在 Kimi、GLM、Minimax 等提供商间切换

🚀 **零配置安装** - npm 安装时自动配置 shell hook

🐚 **跨 Shell 支持** - 支持 Bash、Zsh、Fish、PowerShell 及 5+ 种其他 Shell

🔄 **幂等操作** - 安全地多次运行，不会产生重复条目

📦 **轻量级** - 最小依赖，总大小仅 ~50KB

✅ **Anthropic 兼容** - 支持任何 Anthropic API 兼容的提供商

## 快速开始

```bash
# 全局安装
npm install -g @free-air/claude-code

# 初始化配置文件（包含示例）
free init

# 查看可用的提供商
free list

# 切换到某个提供商
free switch kimi

# 查看当前活跃的配置
free current
```

## 安装

### 全局安装（推荐）

```bash
npm install -g @free-air/claude-code
```

安装后 `free` 命令将在所有 Shell 中可用。Hook 配置会自动完成。

### 本地开发

```bash
npm install --save-dev @free-air/claude-code
npx free --help
```

### 手动安装 Hook

如果自动安装未生效：

```bash
free hook
```

然后打开新的终端或运行：

```bash
source ~/.bashrc  # 或 ~/.zshrc、~/.config/fish/config.fish 等
```

## 命令

### `free list`
列出所有可用的提供商配置。

```bash
$ free list
Available configurations:
  • kimi
  • glm
  • minimax
```

### `free current`
显示当前活跃的提供商配置。

```bash
$ free current
Current config: kimi
```

### `free switch <name>`
切换到指定提供商并加载其环境变量。

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
创建模板配置文件（包含示例提供商）。

```bash
$ free init
[OK] Created example config file: /home/user/.free.json
Edit this file to add your own configurations and API keys.
```

### `free hook`
手动安装 hook 函数到 Shell 配置文件。

```bash
$ free hook
[OK] Installed to /home/user/.bashrc
[OK] Installed to /home/user/.config/fish/config.fish
```

### `free remove`
从所有 Shell 配置文件中移除 hook。

```bash
$ free remove
[OK] Removed from bash: /home/user/.bashrc
[OK] Removed from zsh: /home/user/.zshrc
```

## 配置

配置存储在 `~/.free.json` 文件中（JSON 格式）。

### 配置文件位置

- **Linux/macOS**: `~/.free.json`
- **Windows**: `C:\Users\<用户名>\.free.json`

### 配置示例

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

### 添加新的提供商

编辑 `~/.free.json` 并添加新条目：

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

然后运行：

```bash
free switch my-provider
```

## 支持的 Shell

工具会自动检测并支持以下 Shell：

| Shell | 配置文件 | 状态 |
|-------|---------|------|
| Bash | `~/.bashrc`、`~/.bash_profile` | ✅ 支持 |
| Zsh | `~/.zshrc` | ✅ 支持 |
| Fish | `~/.config/fish/config.fish` | ✅ 支持 |
| PowerShell | 多个位置 | ✅ 支持 |
| Ksh | `~/.kshrc` | ✅ 支持 |
| Tcsh | `~/.tcshrc` | ✅ 支持 |
| Csh | `~/.cshrc` | ✅ 支持 |
| Dash | `~/.dashrc` | ✅ 支持 |
| Sh | `~/.profile` | ✅ 支持 |

## 工作原理

1. **Hook 安装**: npm 安装时，工具会自动在 Shell 配置文件中添加函数。

2. **环境变量加载**: 运行 `free switch <name>` 时，工具输出 Shell 命令来设置环境变量。

3. **Shell 包装函数**: Hook 函数会拦截 `free switch` 并执行输出的命令，使变量在当前会话中生效。

4. **幂等操作**: 安装使用标记块防止重复添加。

## 使用示例

### 为不同项目切换提供商

```bash
# 对于 Kimi 项目
free switch kimi

# 对于 GLM 项目
free switch glm

# 切回默认
free switch minimax
```

### 在脚本中检查当前提供商

```bash
current_provider=$(echo $FREE_CURRENT_CONFIG)
echo "使用的提供商: $current_provider"
```

### 与 Claude CLI 一起使用

```bash
# 切换提供商
free switch kimi

# 运行 Claude 命令（将使用 kimi 的 API 端点）
claude chat "hello world"
```

### 与本地提供商一起使用

```bash
free switch my-local-provider
# 配置为使用 ANTHROPIC_BASE_URL 的工具现在会使用本地提供商
```

## 故障排除

### 命令未找到

**问题**: `free: command not found`

**解决方案**:
1. 验证 npm 安装: `npm list -g @free-air/claude-code`
2. 检查 npm bin 目录是否在 PATH 中: `echo $PATH`
3. 重新安装: `npm install -g @free-air/claude-code`
4. 手动安装 hook: `free hook`

### 新终端中 hook 未加载

**问题**: 打开新终端后 hook 不可用

**解决方案**:
1. 运行 `free hook` 重新安装
2. 打开新的终端窗口
3. 对于 PowerShell: 可能需要修改执行策略

### 配置文件未找到

**问题**: `Failed to parse ~/.free.json`

**解决方案**:
1. 创建并初始化: `free init`
2. 验证 JSON 格式: `cat ~/.free.json`
3. 使用 JSON 验证工具检查语法

### 环境变量未设置

**问题**: 运行 `free switch` 后变量不可用

**解决方案**:
1. 验证是否使用了包装函数: `type free` (bash/zsh) 或 `Get-Command free` (PowerShell)
2. 检查 hook 是否已安装: `grep -n "free-env manager" ~/.bashrc`
3. 验证配置文件存在: `cat ~/.free.json`
4. 重新安装 hook: `free hook`

### 多个 Shell 配置文件

**问题**: Hook 安装到了错误的位置

**解决方案**: 工具检查多个标准位置。如需添加到其他配置文件，可手动添加：

```bash
# 对于 bash
source ~/.bashrc

# 对于 zsh
source ~/.zshrc

# 对于 fish
source ~/.config/fish/config.fish
```

## 环境变量

运行 `free switch kimi` 时，工具会设置：

- `FREE_CURRENT_CONFIG` - 活跃的提供商名称
- 配置中的所有环境变量

### 检查当前提供商

```bash
echo $FREE_CURRENT_CONFIG
```

## 卸载

```bash
# 全局卸载
npm uninstall -g @free-air/claude-code

# 清理 shell 配置
free remove
```

## API 兼容性

此工具适用于任何遵循 Anthropic API 规范的提供商，包括：

- **Moonshot AI** (Kimi)
- **Zhipu AI** (GLM)
- **Minimax**
- Claude (Anthropic)
- 自定义本地提供商

## 开发

### 代码仓库

```bash
git clone https://github.com/wusfe/switch-claude-model.git
cd switch-claude-model
npm install
npm run build
npm link
```

### 测试

```bash
free hook
free list
free switch kimi
free current
free remove
```

## License

MIT License - 可自由用于个人或商业项目

## 作者

**wusfe** - [GitHub](https://github.com/wusfe)

## 贡献

欢迎提交 Issue 和 Pull Request 到 [GitHub](https://github.com/wusfe/switch-claude-model)

## 更新日志

### v0.1.0 (2026-04-02)

- 首次发布
- 支持 9 种 Shell 类型（Bash、Zsh、Fish、PowerShell、Ksh、Tcsh、Csh、Dash、Sh）
- 通过 npm postinstall 自动安装 hook
- 通过 `free hook` 命令手动安装 hook
- 多文件配置支持
- 幂等块插入/删除支持
