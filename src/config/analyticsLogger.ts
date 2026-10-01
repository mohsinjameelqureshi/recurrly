import { posthog } from "./posthog";

type LogAttributes = Record<string, string | number | boolean>;

export const analyticsLogger = {
  info(body: string, attributes?: LogAttributes) {
    posthog?.logger.info(body, attributes);
  },
  error(body: string, attributes?: LogAttributes) {
    posthog?.logger.error(body, attributes);
  },
};
