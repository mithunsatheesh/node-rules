import commonjs from "@rollup/plugin-commonjs";
import globals from "rollup-plugin-node-globals";

export default [
  {
    input: "dist/index.js",
    plugins: [commonjs(), globals()],
    output: {
      name: "NodeRules",
      format: "umd",
      extend: true,
      exports: "named",
      file: `dist/node-rules.min.js`,
    },
  },
];
