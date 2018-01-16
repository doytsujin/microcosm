module.exports = {
  globals: {
    Promise: true,
    jest: true,
    expect: true,
    // microcosm-devtools
    chrome: true
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true
    }
  },
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    }
  },
  extends: ['eslint:recommended', 'plugin:flowtype/recommended'],
  plugins: ['react', 'flowtype', 'flowtype-errors', 'prettier'],
  rules: {
    'no-use-before-define': [
      'error',
      { functions: false, classes: false, variables: true }
    ],
    'sort-vars': 0,
    'no-console': 0,
    'no-unused-vars': [
      2,
      {
        args: 'none',
        varsIgnorePattern: '^h$'
      }
    ],
    'prettier/prettier': 'error',
    'react/jsx-equals-spacing': ['warn', 'never'],
    'react/jsx-no-duplicate-props': [
      'warn',
      {
        ignoreCase: true
      }
    ],
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': [
      'warn',
      {
        allowAllCaps: true,
        ignore: []
      }
    ],
    'react/jsx-uses-react': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/no-danger-with-children': 'warn',
    'react/no-deprecated': 'warn',
    'react/no-direct-mutation-state': 'warn',
    'react/no-is-mounted': 'warn',
    'react/require-render-return': 'warn',
    'react/style-prop-object': 'warn'
  }
}
