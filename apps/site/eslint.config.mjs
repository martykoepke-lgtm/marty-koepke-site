import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Ops-monitor enforcement: ban direct imports of external API SDKs.
  // The wrappers in lib/avi/llm.ts and lib/avi/email.ts are the single
  // points where these SDKs get called, so per-call logging captures
  // every external API hit. Direct imports outside the wrapper files
  // bypass logging and break the spend-cap math.
  //
  // The "files" override below re-enables direct imports inside the
  // wrapper files themselves (lib/avi/llm-providers/* and lib/avi/email.ts).
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@anthropic-ai/sdk",
              message:
                "Don't import Anthropic SDK directly — use llmCall() from @/lib/avi/llm instead. See AVI_OPS_MONITOR.md §4.1.",
            },
            {
              name: "openai",
              message:
                "Don't import OpenAI SDK directly — use llmCall() from @/lib/avi/llm instead. See AVI_OPS_MONITOR.md §4.1.",
            },
            {
              name: "@google/generative-ai",
              message:
                "Don't import Google Generative AI SDK directly — use llmCall() from @/lib/avi/llm instead. See AVI_OPS_MONITOR.md §4.1.",
            },
            {
              name: "resend",
              message:
                "Don't import Resend SDK directly — use sendEmail() from @/lib/avi/email instead. See AVI_OPS_MONITOR.md §4.1.",
            },
          ],
        },
      ],
    },
  },

  // Exception: the wrappers themselves must import the SDKs.
  {
    files: ["lib/avi/llm-providers/**/*.{ts,tsx}", "lib/avi/email.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
