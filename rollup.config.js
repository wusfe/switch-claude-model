import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";

const commonPlugins = [
  replace({
    "process.env.NODE_ENV": JSON.stringify("production"),
    preventAssignment: true
  }),
  resolve({ preferBuiltins: true }),
  commonjs(),
  json()
];

const cliConfig = {
  input: "bin/cli.js",
  output: {
    file: "dist/cli.js",
    format: "cjs",
    banner: "#!/usr/bin/env node\n",
    sourcemap: false
  },
  plugins: commonPlugins
};

const libConfig = {
  input: "lib/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs",
    sourcemap: false
  },
  plugins: commonPlugins
};

const postinstallConfig = {
  input: "scripts/postinstall.js",
  output: {
    file: "dist/postinstall.js",
    format: "cjs",
    banner: "#!/usr/bin/env node\n",
    sourcemap: false
  },
  plugins: commonPlugins
};

export default [cliConfig, libConfig, postinstallConfig];
