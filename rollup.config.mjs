import commonjs from "@rollup/plugin-commonjs";
import globals from "rollup-plugin-node-globals";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "dist/index.js",
    plugins: [nodeResolve(), commonjs(), globals(), terser()],
    output: {
      name: "NodeRules",
      format: "umd",
      extend: true,
      exports: "named",
      file: `dist/node-rules.min.js`,
    },
  },
];
