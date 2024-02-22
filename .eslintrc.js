module.exports = {
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  plugins: ['react', '@typescript-eslint', 'jest'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    node: true,
    browser: true,
    jest: true,
  },
  rules: {
    'no-nested-ternary': 0,
    'import/no-cycle': 0,
    'import/no-named-as-default': 0,
    'prefer-exponentiation-operator': 'off',
    'prettier/prettier': 'error',
    'global-require': 'off',
    'no-await-in-loop': 'off',
    'no-prototype-builtins': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': 'off',
    'jest/no-export': 'off',
    'import/prefer-default-export': 'off',
    'no-use-before-define': 'off',
    'no-console': [2, { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-use-before-define': 'off',
    'default-case': 'off',
    'react/jsx-props-no-spreading': 'off',
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],

    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    'no-empty-function': 'off',
    'no-empty': 'off',
    'consistent-return': 'off',
    'react/require-default-props': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['*Slice.ts'],
      rules: {
        'no-param-reassign': 'off',
      },
    },
  ],
}
