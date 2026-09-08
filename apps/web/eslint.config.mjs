import next from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import base from '@whaledex/config/eslint';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@next/next': next, 'react-hooks': reactHooks },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
];
