module.exports = {
  env: {
    node: true,
    browser: false,
    commonjs: false,
    es6: true,
  },
  extends: ["airbnb-base", "prettier", "plugin:node/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ["prettier"],
  rules: {
    camelcase: 0,
    "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "no-console": 0,
    "prettier/prettier": ["error"],
    curly: [2, "all"],
  },
};
