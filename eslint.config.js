module.exports = [
  {
    ignores: ["node_modules/**", "_site/**"]
  },
  {
    files: ["src/assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn"],
      "no-console": "off"
    }
  }
];