const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { CMD_NAME, ENV_PREFIX, MARKER_START, MARKER_END } = require('./constants');

// ===== Shell Detection Functions =====
// Helpers for shell detection based on environment and process info
function getProcessCommand(pid) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`wmic process where processid=${pid} get commandline`, { encoding: 'utf8' });
      const lines = output.split('\n');
      if (lines.length > 1) {
        const cmdLine = lines[1].trim();
        if (cmdLine) return cmdLine;
      }
    } else {
      try {
        const cmdline = fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim();
        if (cmdline) return cmdline;
      } catch (e) {
        const output = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' });
        return output.trim();
      }
    }
  } catch (e) {}
  return null;
}

function detectFromCommand(cmd) {
  const lower = cmd.toLowerCase();
  if (lower.includes('powershell')) return 'powershell';
  if (lower.includes('pwsh')) return 'powershell';
  if (lower.includes('fish')) return 'fish';
  if (lower.includes('zsh')) return 'zsh';
  if (lower.includes('bash')) return 'bash';
  if (lower.includes('ksh')) return 'ksh';
  if (lower.includes('tcsh')) return 'tcsh';
  if (lower.includes('csh')) return 'csh';
  if (lower.includes('dash')) return 'dash';
  // Match generic 'sh' last to avoid false positives
  if (lower.includes('sh')) return 'sh';
  return null;
}

function detectFromPath(shellPath) {
  const base = path.basename(shellPath).toLowerCase();
  if (base.includes('powershell') || base.includes('pwsh')) return 'powershell';
  if (base.includes('fish')) return 'fish';
  if (base.includes('zsh')) return 'zsh';
  if (base.includes('bash')) return 'bash';
  if (base.includes('ksh')) return 'ksh';
  if (base.includes('tcsh')) return 'tcsh';
  if (base.includes('csh')) return 'csh';
  if (base.includes('dash')) return 'dash';
  if (base === 'sh') return 'sh';
  return null;
}

function detectShell() {
  // Allow explicit shell override via environment
  if (process.env.FREECC_SHELL) return process.env.FREECC_SHELL.toLowerCase();
  if (process.env.WC_SHELL) return process.env.WC_SHELL.toLowerCase();

  // Check shell-specific environment variables
  if (process.env.FISH_VERSION) return 'fish';
  if (process.env.ZSH_VERSION) return 'zsh';
  if (process.env.BASH_VERSION) return 'bash';

  // Check SHELL environment variable
  const shellPath = process.env.SHELL || '';
  if (shellPath) {
    const shell = detectFromPath(shellPath);
    if (shell) return shell;
  }

  // Windows MSYS/MinGW detection
  if (process.env.MSYSTEM) return 'bash';
  if (process.env.TERM && /(xterm|msys|mingw|cygwin)/i.test(process.env.TERM)) return 'bash';

  // PowerShell detection (higher priority than cmd.exe)
  if (process.env.PSModulePath) return 'powershell';

  try {
    const parentCmd = getProcessCommand(process.ppid);
    if (parentCmd) {
      const shell = detectFromCommand(parentCmd);
      if (shell) return shell;
    }
  } catch (e) {}

  if (process.platform === 'win32') {
    if (process.env.COMSPEC) {
      const shell = detectFromPath(process.env.COMSPEC);
      if (shell) return shell;
    }
  }

  // Terminal emulator detection
  if (process.env.TERM_PROGRAM) {
    const term = process.env.TERM_PROGRAM.toLowerCase();
    if (term.includes('fish')) return 'fish';
    if (term.includes('zsh')) return 'zsh';
    if (term.includes('bash')) return 'bash';
  }

  // Default fallback
  return 'bash';
}

// Shell configuration file paths (multiple locations supported)
const SHELL_CONFIG_PATHS = {
  bash: [path.join(os.homedir(), '.bashrc'), path.join(os.homedir(), '.bash_profile')],
  zsh: [path.join(os.homedir(), '.zshrc')],
  fish: [path.join(os.homedir(), '.config/fish/config.fish')],
  ksh: [path.join(os.homedir(), '.kshrc')],
  tcsh: [path.join(os.homedir(), '.tcshrc')],
  csh: [path.join(os.homedir(), '.cshrc')],
  dash: [path.join(os.homedir(), '.dashrc')],
  sh: [path.join(os.homedir(), '.profile')],
  powershell: [
    path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
    path.join(os.homedir(), 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
    path.join(os.homedir(), '.config', 'powershell', 'Microsoft.PowerShell_profile.ps1')
  ]
};

function getShellConfigFile(shellType) {
  // Return first existing config file for backward compatibility
  const candidates = SHELL_CONFIG_PATHS[shellType] || SHELL_CONFIG_PATHS.bash;
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return candidates[0];
}

function getAllShellConfigFiles(shellType) {
  // Return all existing config files for the shell type
  const candidates = SHELL_CONFIG_PATHS[shellType] || SHELL_CONFIG_PATHS.bash;
  return candidates.filter(file => fs.existsSync(file));
}

// Generate shell-specific env var commands with proper escaping
function generateEnvCommands(shellType, envVars, configName) {
  const commands = [];
  switch (shellType) {
    case 'fish':
      for (const [k, v] of Object.entries(envVars)) {
        commands.push(`set -gx ${k} "${String(v).replace(/"/g, '\\"')}"`);
      }
      commands.push(`set -gx ${ENV_PREFIX} "${String(configName).replace(/"/g, '\\"')}"`);
      break;
    case 'tcsh':
    case 'csh':
      for (const [k, v] of Object.entries(envVars)) {
        commands.push(`setenv ${k} "${String(v).replace(/"/g, '\\"')}"`);
      }
      commands.push(`setenv ${ENV_PREFIX} "${String(configName).replace(/"/g, '\\"')}"`);
      break;
    case 'powershell':
      // PowerShell uses double-quotes to escape quotes
      for (const [k, v] of Object.entries(envVars)) {
        commands.push(`$env:${k} = "${String(v).replace(/"/g, '""')}"`);
      }
      commands.push(`$env:${ENV_PREFIX} = "${String(configName).replace(/"/g, '""')}"`);
      break;
    default:
      for (const [k, v] of Object.entries(envVars)) {
        commands.push(`export ${k}="${String(v).replace(/"/g, '\\"')}"`);
      }
      commands.push(`export ${ENV_PREFIX}="${String(configName).replace(/"/g, '\\"')}"`);
      break;
  }
  return commands;
}

// Generate shell function wrapper that handles 'free switch' command
function generateShellFunction(shellType) {
  const functions = {
    bash: `${MARKER_START}
# Auto-generated by ${CMD_NAME}-env npm package
${CMD_NAME}() {
  if [ "$1" = "switch" ]; then
    eval "$(command ${CMD_NAME} switch "$2")"
  elif [ "$1" = "list" ] || [ "$1" = "current" ] || [ "$1" = "init" ]; then
    command ${CMD_NAME} "$@"
  else
    command ${CMD_NAME} "$@"
  fi
}
echo "[OK] ${CMD_NAME}-env manager loaded"
${MARKER_END}`,
    zsh: `${MARKER_START}
# Auto-generated by ${CMD_NAME}-env npm package
${CMD_NAME}() {
  if [ "$1" = "switch" ]; then
    eval "$(command ${CMD_NAME} switch "$2")"
  elif [ "$1" = "list" ] || [ "$1" = "current" ] || [ "$1" = "init" ]; then
    command ${CMD_NAME} "$@"
  else
    command ${CMD_NAME} "$@"
  fi
}
echo "[OK] ${CMD_NAME}-env manager loaded"
${MARKER_END}`,
    fish: `${MARKER_START}
# Auto-generated by ${CMD_NAME}-env npm package
function ${CMD_NAME}
  if test "$argv[1]" = "switch"
    eval (command ${CMD_NAME} switch $argv[2] | source)
  else
    command ${CMD_NAME} $argv
  end
end
echo "[OK] ${CMD_NAME}-env manager loaded"
${MARKER_END}`,
    ksh: `${MARKER_START}
# Auto-generated by ${CMD_NAME}-env npm package
${CMD_NAME}() {
  if [ "$1" = "switch" ]; then
    eval "$(command ${CMD_NAME} switch "$2")"
  else
    command ${CMD_NAME} "$@"
  fi
}
echo "[OK] ${CMD_NAME}-env manager loaded"
${MARKER_END}`,
    tcsh: `${MARKER_START}
# Auto-generated by ${CMD_NAME}-env npm package
alias ${CMD_NAME} '\\
  if ("$1" == "switch") then \\
    eval \`command ${CMD_NAME} switch $2\` \\
  else \\
    command ${CMD_NAME} $* \\
  endif \\
'
echo "[OK] ${CMD_NAME}-env manager loaded"
${MARKER_END}`,
    // PowerShell: avoid recursion by calling the .cmd wrapper directly
    powershell: `${MARKER_START}
# Auto-generated by ${CMD_NAME}-env npm package
function ${CMD_NAME} {
  param([Parameter(ValueFromRemainingArguments=$true)]$args)
  if ($args[0] -eq "switch") {
    $output = & ${CMD_NAME}.cmd @args 2>&1 | Out-String
    Invoke-Expression $output
  } else {
    & ${CMD_NAME}.cmd @args
  }
}
Write-Host "[OK] ${CMD_NAME}-env manager loaded" -ForegroundColor Green
${MARKER_END}`
  };
  return functions[shellType] || functions.bash;
}

function getCurrentShell() {
  const type = detectShell();
  const configFile = getShellConfigFile(type);
  const functionCode = generateShellFunction(type);
  return { type, configFile, functionCode };
}

// Remove hooks from all shell config files
function removeHooks() {
  const shellTypes = ['bash', 'zsh', 'fish', 'ksh', 'tcsh', 'csh', 'dash', 'sh', 'powershell'];
  const results = [];

  for (const shellType of shellTypes) {
    const configFiles = getAllShellConfigFiles(shellType);
    if (configFiles.length === 0) {
      results.push({ shell: shellType, file: null, status: 'not-found' });
      continue;
    }

    for (const configFile of configFiles) {
      try {
        let content = fs.readFileSync(configFile, 'utf8');
        const originalContent = content;

        // Remove hook block using markers
        const pattern = new RegExp(
          `\\n?${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}\\n?`,
          'g'
        );
        content = content.replace(pattern, '\n');

        // Clean up extra blank lines
        content = content.replace(/\n{3,}/g, '\n\n').trim();
        if (content) content += '\n';

        if (content !== originalContent) {
          fs.writeFileSync(configFile, content, 'utf8');
          results.push({ shell: shellType, file: configFile, status: 'removed' });
        } else {
          results.push({ shell: shellType, file: configFile, status: 'not-found' });
        }
      } catch (err) {
        results.push({ shell: shellType, file: configFile, status: 'error', error: err.message });
      }
    }
  }

  return results;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Idempotently insert or update a managed code block
function upsertManagedBlock(content, block) {
  const hasStart = content.includes(MARKER_START);
  const hasEnd = content.includes(MARKER_END);

  if (hasStart && hasEnd) {
    // Replace existing block
    const pattern = new RegExp(
      `${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`,
      'm'
    );
    return { changed: true, content: content.replace(pattern, block) };
  }

  if (hasStart && !hasEnd) {
    // Fix incomplete block (missing end marker)
    const startIndex = content.indexOf(MARKER_START);
    return { changed: true, content: `${content.slice(0, startIndex).trimEnd()}\n\n${block}\n` };
  }

  // Append new block
  return { changed: true, content: `${content.trimEnd()}\n\n${block}\n` };
}

module.exports = {
  detectShell,
  getCurrentShell,
  getShellConfigFile,
  getAllShellConfigFiles,
  generateEnvCommands,
  generateShellFunction,
  removeHooks,
  upsertManagedBlock,
  SHELL_CONFIG_PATHS
};
