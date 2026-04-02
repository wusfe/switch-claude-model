const fs = require("fs");
const path = require("path");
const {
  detectShell,
  getCurrentShell,
  generateEnvCommands,
  removeHooks,
  generateShellFunction,
  upsertManagedBlock,
  getAllShellConfigFiles,
  SHELL_CONFIG_PATHS,
} = require("./shell");
const { CMD_NAME, CONFIG_FILE, ENV_PREFIX } = require("./constants");

function loadAllConfigs() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Failed to parse ${CONFIG_FILE}:`, err.message);
    process.exit(1);
  }
}

function loadConfig(name) {
  const all = loadAllConfigs();
  if (!all[name]) {
    const available = Object.keys(all);
    console.error(`❌ Config "${name}" not found`);
    if (available.length) {
      console.error("\nAvailable configs:");
      available.forEach((c) => console.error(`  • ${c}`));
    }
    process.exit(1);
  }
  return { name, env: all[name] };
}

function listConfigs() {
  const all = loadAllConfigs();
  const names = Object.keys(all);
  if (names.length === 0) {
    console.log("No configurations found.");
    console.log(`\nCreate your first config in ${CONFIG_FILE}`);
    process.exit(0);
  }
  console.log("Available configurations:");
  names.forEach((name) => console.log(`  • ${name}`));
}

function showCurrent() {
  const current = process.env[ENV_PREFIX];
  if (current) {
    console.log(`Current config: ${current}`);
  } else {
    console.log("No active configuration");
  }
}

function initConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const example = {
      kimi: {
        ANTHROPIC_BASE_URL: "https://api.kimi.com/coding/",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-k2.5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-k2.5",
        ENABLE_TOOL_SEARCH: "false",
      },
      minimax: {
        ANTHROPIC_BASE_URL: "https://api.minimaxi.com/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        API_TIMEOUT_MS: "3000000",
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
        ANTHROPIC_MODEL: "MiniMax-M2.7",
        ANTHROPIC_SMALL_FAST_MODEL: "MiniMax-M2.7",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "MiniMax-M2.7",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "MiniMax-M2.7",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "MiniMax-M2.7",
      },
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(example, null, 2));
    console.log(`✅ Created example config file: ${CONFIG_FILE}`);
    console.log(
      `\nEdit this file to add your own configurations and API keys.`,
    );
  } else {
    console.log(`ℹ️  Config file already exists: ${CONFIG_FILE}`);
  }
}

// Install hook to all shell config file locations
function installHook() {
  const shellType = detectShell();
  const shellInfo = getCurrentShell();
  const { functionCode } = shellInfo;

  const configFiles = getAllShellConfigFiles(shellType);
  const allCandidates =
    SHELL_CONFIG_PATHS[shellType] || SHELL_CONFIG_PATHS.bash;

  if (!allCandidates || allCandidates.length === 0) {
    console.error(`❌ Could not detect shell configuration file`);
    console.error(
      `Please manually add ${CMD_NAME} function to your shell config`,
    );
    process.exit(1);
  }

  try {
    let installed = 0;
    let alreadyInstalled = 0;
    const filesToProcess =
      configFiles.length > 0 ? configFiles : [allCandidates[0]];

    for (const configFile of filesToProcess) {
      fs.mkdirSync(path.dirname(configFile), { recursive: true });

      let content = "";
      if (fs.existsSync(configFile)) {
        content = fs.readFileSync(configFile, "utf8");
      }

      const result = upsertManagedBlock(content, functionCode);
      if (result.changed) {
        fs.writeFileSync(configFile, result.content, "utf8");
        installed++;
        console.log(`✅ Installed to: ${configFile}`);
      } else {
        alreadyInstalled++;
      }
    }

    if (installed > 0) {
      console.log(`\n✅ ${CMD_NAME} hook installed successfully`);
      if (alreadyInstalled > 0) {
        console.log(`ℹ️  ${alreadyInstalled} location(s) already had the hook`);
      }
    } else if (alreadyInstalled > 0) {
      console.log(`ℹ️  Hook is already installed in all locations`);
    }
  } catch (err) {
    console.error(`❌ Error installing hook: ${err.message}`);
    process.exit(1);
  }
}

function removeConfig() {
  const results = removeHooks();
  let removed = 0;
  let errors = 0;

  for (const result of results) {
    if (result.status === "removed") {
      console.log(`✅ Remove from ${result.shell}: ${result.file}`);
      removed++;
    } else if (result.status === "error") {
      console.error(`❌ ${result.shell} error: ${result.error}`);
      errors++;
    }
  }

  if (removed === 0 && errors === 0) {
    console.log(`ℹ️  No ${CMD_NAME} hooks found`);
  } else {
    console.log(`\n✅ Removed ${removed} hook(s)`);
    if (errors) console.log(`⚠️  ${errors} error(s) encountered`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const configName = args[1];

  if (command === "init") {
    initConfig();
    process.exit(0);
  }

  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    console.log(`
${CMD_NAME} - Environment configuration switcher (like nvm)

Usage:
  ${CMD_NAME} switch <name>    Switch to specified configuration
  ${CMD_NAME} list             List all available configurations
  ${CMD_NAME} current          Show current active configuration
  ${CMD_NAME} init             Initialize config file with example
  ${CMD_NAME} hook             Install hook function to shell config
  ${CMD_NAME} remove           Remove ${CMD_NAME} hooks from all shell configs

Examples:
  ${CMD_NAME} switch kimi      Load kimi's environment variables
  ${CMD_NAME} list             Show all available configs
  ${CMD_NAME} current          Show current active config
  ${CMD_NAME} hook             Auto-install hook to shell profile
  ${CMD_NAME} remove           Clean up shell configuration files

Config File:
  ${CONFIG_FILE}
`);
    process.exit(0);
  }

  if (command === "list") {
    listConfigs();
    process.exit(0);
  }

  if (command === "current") {
    showCurrent();
    process.exit(0);
  }

  if (command === "switch") {
    if (!configName) {
      console.error(`❌ Please specify a configuration name`);
      console.error(`Usage: ${CMD_NAME} switch <name>`);
      process.exit(1);
    }
    const config = loadConfig(configName);
    const shellInfo = getCurrentShell();
    const commands = generateEnvCommands(
      shellInfo.type,
      config.env,
      configName,
    );
    commands.forEach((cmd) => console.log(cmd));

    // Output shell-specific success message
    switch (shellInfo.type) {
      case "powershell":
        console.log(
          `Write-Host "[OK] Switched to config: ${configName}" -ForegroundColor Green`,
        );
        break;
      case "fish":
        console.log(`echo "[OK] Switched to config: ${configName}"`);
        break;
      default:
        console.log(`echo "[OK] Switched to config: ${configName}"`);
    }

    process.exit(0);
  }

  if (command === "remove") {
    removeConfig();
    process.exit(0);
  }

  if (command === "hook") {
    installHook();
    process.exit(0);
  }

  console.error(`❌ Unknown command: ${command}`);
  console.error(`Run "${CMD_NAME} help" for usage information`);
  process.exit(1);
}

module.exports = { main };
