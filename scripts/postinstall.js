const fs = require('fs');
const path = require('path');
const { getCurrentShell, getAllShellConfigFiles, upsertManagedBlock } = require('../lib/shell');
const { CMD_NAME } = require('../lib/constants');

function main() {
  const shellInfo = getCurrentShell();
  const { type, configFile, functionCode } = shellInfo;

  const configFiles = getAllShellConfigFiles(type);
  if (configFiles.length === 0) {
    if (!configFile || typeof configFile !== 'string') {
      console.log('[WARN] Could not detect shell configuration file.');
      console.log(`       Please add ${CMD_NAME} function manually to your shell config.`);
      return;
    }
    configFiles.push(configFile);
  }

  let installed = 0;
  let errors = 0;

  for (const file of configFiles) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      const result = upsertManagedBlock(content, functionCode);

      if (result.changed) {
        fs.writeFileSync(file, result.content, 'utf8');
        console.log(`[OK] Installed to ${file}`);
        installed++;
      }
    } catch (err) {
      console.error(`[ERROR] ${file}: ${err.message}`);
      errors++;
    }
  }

  if (installed > 0) {
    console.log(`\n[OK] Successfully installed ${installed} hook(s)`);
    if (errors) console.log(`[WARN] ${errors} error(s) encountered`);
  }
}

main();
