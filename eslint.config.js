import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      "no-unused-vars": "error",
      "no-console": "warn",
      eqeqeq: "error",
      curly: "error",
    },
  },
  { ignores: ["node_modules/", "coverage/"] },
];
