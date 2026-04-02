# 项目架构 (简明版)

## 文件结构

```
switch-claude-model/
├── lib/
│   ├── constants.js        🔋 核心配置：命令名、环境变量前缀、标记块
│   ├── shell.js            🔋 核心引擎：shell检测、env生成、hook管理
│   └── index.js            📋 CLI 主函数：命令路由、配置管理
├── scripts/
│   └── postinstall.js      📥 安装钩子：在npm install时注册hook
├── bin/
│   └── cli.js              🚀 入口点：调用 lib/index.js
├── dist/                   🏗️ 编译输出（rollup构建）
├── package.json            📦 项目定义、依赖、build脚本
└── rollup.config.mjs       ⚙️ 构建配置

[用户的shell] ← 读/写 → [~/.bashrc, ~/.zshrc, ...]
                          (通过标记块管理hook)
```

---

## 核心流程

### 1️⃣ 安装流程
```
npm install @free-air/claude-code
  ↓
package.json: "postinstall": "node ./dist/postinstall.js"
  ↓
scripts/postinstall.js
  ├─ detectShell() → 检测当前shell类型
  ├─ getAllShellConfigFiles(type) → 获取所有可能的config文件
  ├─ generateShellFunction(type) → 生成shell特定的wrapper函数
  └─ 在每个位置写入hook: ~/.bashrc, ~/.zshrc, PowerShellProfile...
```

### 2️⃣ 执行流程
```
$ freecc switch myconfig
  ↓
(实际执行 ~/.local/bin/freecc 或 C:\...\freecc.cmd)
  ↓
lib/index.js main()
  ├─ loadConfig('myconfig') → 读 ~/.freecc.json
  ├─ getCurrentShell() → 检测当前shell
  ├─ generateEnvCommands(type, env, name) → 生成env设置命令
  └─ console.log() → 输出到stdout
  
(Shell捕获输出 → eval/source → 注入环境变量)
  ↓
[shell中的环境变量被更新]
```

### 3️⃣ 清理流程
```
$ freecc remove
  ↓
removeConfig()
  ├─ removeHooks() → 清理所有shell配置
  └─ 输出清理结果

removeHooks():
  ├─ 遍历所有shell类型
  ├─ 获取所有配置文件: getAllShellConfigFiles(type)
  └─ 逐一删除标记块: MARKER_START...MARKER_END
```

---

## 🔋 关键设计

### 智能 Hook 注册
- **多位置支持**: 同一shell可能有多个config文件 (.bashrc + .bash_profile)
- **对称设计**: 安装和卸载的流程对称，保证完整清理
- **标记块机制**: 用 `# >>> freecc-env manager >>>` 标记自动生成的代码
- **幂等更新**: 重复运行 `npm install` 不会重复写入

### PowerShell 特殊处理
```javascript
// ⚠️ PowerShell 转义规则不同：
bash:       export KEY="value\"quote"     // \" 转义
powershell: $env:KEY = "value""quote"     // "" 转义

// ⚠️ PowerShell 递归问题：
避免:   function freecc { freecc ... }    // 调用自己
改为:   function freecc { & freecc.cmd }  // 调用外部
```

### Shell 检测优先级
1. `FREECC_SHELL` / `WC_SHELL` 环境变量 (手动override)
2. Shell版本变量 (`FISH_VERSION`, `ZSH_VERSION`, `BASH_VERSION`)
3. `$SHELL` 环境变量
4. `$PSModulePath` (PowerShell)
5. 父进程检测 (用 wmic/ps 读进程名)
6. `$COMSPEC` (Windows)
7. 默认值: bash

---

## 📋 配置文件格式

### ~/.freecc.json
```json
{
  "kimi": {
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "xxx",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k2.5"
  },
  "glm": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "yyy",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6"
  }
}
```

### ~/.bashrc (安装后)
```bash
# >>> freecc-env manager >>>
freecc() {
  if [ "$1" = "switch" ]; then
    eval "$(command freecc switch "$2")"
  else
    command freecc "$@"
  fi
}
# <<< freecc-env manager <<<
```

---

## 🚀 CLI 命令

| 命令 | 功能 | 输出 |
|------|------|------|
| `freecc switch <name>` | 切换配置 | Shell环境变量命令 (由hook eval/source) |
| `freecc list` | 列出所有配置 | 配置名称列表 |
| `freecc current` | 显示当前配置 | 当前active的配置名 (读 `$FREE_CURRENT_CONFIG`) |
| `freecc init` | 初始化配置文件 | 创建 ~/.freecc.json 示例 |
| `freecc remove` | 清理hook | 清理结果 + 文件位置 |
| `freecc help` | 显示帮助 | 命令文档 |

---

## 🔐 安全考虑

1. **标记块隔离**: 只修改标记块内的内容，不触及用户代码
2. **备份机制**: 可以手动删除标记块来清理（rollback）
3. **权限**: 只修改用户home目录下的文件
4. **环境变量**: 通过eval/source实现，不修改全局环境

---

## 🛠️ 常见问题

**Q: 为什么用标记块？**
A: 保证每次安装都是幂等的，避免重复写入。如果用户删了标记块，下次安装会自动添加。

**Q: PowerShell 为什么不用 npm exec？**
A: npm exec 会额外启动npm进程，较重。直接调用 .cmd 更轻快。

**Q: 支持多个shell吗？**
A: 支持。删除后可立即在另一个shell使用（需要新终端），因为hook在每个shell config中都有。

**Q: 如何override shell检测？**
A: 设置环境变量 `FREECC_SHELL=bash` 或 `WC_SHELL=zsh`

