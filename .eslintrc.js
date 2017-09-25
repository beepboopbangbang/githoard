module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/base'
  ],
  globals: {
    __static: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    'global-require': 0,
    'import/no-unresolved': 0,
    "semi": ["error", "always"],
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-param-reassign': 0,
    'no-multi-assign': 0,
    'no-shadow': 0,
    'no-unused-vars': ["error", { "args": "none" }],
    'no-console': ["error", { allow: ["warn", "error"] }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
