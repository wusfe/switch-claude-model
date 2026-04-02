const path = require('path');
const os = require('os');

const CMD_NAME = 'free';
const ENV_PREFIX = 'FREE_CURRENT_CONFIG';
const CONFIG_FILE = path.join(os.homedir(), '.free.json');

// Markers used to identify auto-generated hook blocks in shell configs
const MARKER_START = `# >>> ${CMD_NAME}-env manager >>>`;
const MARKER_END = `# <<< ${CMD_NAME}-env manager <<<`;

module.exports = {
  CMD_NAME,
  ENV_PREFIX,
  CONFIG_FILE,
  MARKER_START,
  MARKER_END
};