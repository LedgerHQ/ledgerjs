module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "no-console": 0,
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "flowtype/space-after-type-colon": [2, "always", { allowLineBreak: true }],
    "prettier/prettier": "error",
    "@typescript-eslint/no-use-before-define": "off"
  },
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    }
  }
};
