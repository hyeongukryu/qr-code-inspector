import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tailwind from 'eslint-plugin-tailwindcss';

export default defineConfig([
  ...nextVitals,
  ...tailwind.configs['flat/recommended'],
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'zxing-js/**']),
]);
