export default {
  env: {
    browser: true,
    es2021: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest"
  },
  rules: {
    "no-unused-vars": ["warn"],
    "no-console": "off"
  },
  ignores: [
    "node_modules/**",
    "_site/**"
  ]
};