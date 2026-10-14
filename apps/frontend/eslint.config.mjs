// eslint-config-next v16 ships native flat configs, so no FlatCompat
// translation is needed (and it would fail with ESLint 10 anyway).
import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    // React-compiler rules new in eslint-config-next v16. The codebase
    // predates them (~130 files use the fetch-in-effect pattern, chart
    // components declared during render, RSC try/catch JSX, …). Each needs
    // an individual refactor, so they warn until that happens instead of
    // drowning lint output in errors.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/error-boundaries": "warn",
    },
  },
];

export default eslintConfig;
