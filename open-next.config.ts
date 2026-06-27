import type { OpenNextConfig } from "open-next/externals/config";

const config: OpenNextConfig = {
  default: {
    runtime: "edge",
  },
  middleware: {
    external: true,
  },
};

export default config;
