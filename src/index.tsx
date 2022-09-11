/* @refresh reload */
import { ErrorBoundary, render } from "solid-js/web";

import "./index.css";
import App, { log } from "./App";
import ErrorComponent from "./Error";
import { QueryClient, QueryClientProvider } from "@adeora/solid-query";

const queryClient = new QueryClient({
  logger: {
    error(...args) {
      log("[Query Error]", ...args);
    },
    log(...args) {
      log("[Query Log]", ...args);
    },
    warn(...args) {
      log("[Query Warn]", ...args);
    },
  },
});

render(
  () => (
    <ErrorBoundary
      fallback={(err) => <ErrorComponent error={err}></ErrorComponent>}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  ),
  (() => {
    const app = document.createElement("div");
    document.body.append(app);
    return app;
  })()
);
