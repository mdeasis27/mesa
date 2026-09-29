import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ai-kit/ is a vendored kit synced from the hub; its lint debt is owned
    // upstream (see portafolio-mdea/ai-kit) and is not this project's to fix.
    "ai-kit/**",
  ]),
]);

export default eslintConfig;
