/* @refresh reload */
import { ErrorBoundary, render } from "solid-js/web";

import "./index.css";
import App from "./App";
import ErrorComponent from "./Error";

render(
  () => (
    <ErrorBoundary
      fallback={(err) => <ErrorComponent error={err}></ErrorComponent>}
    >
      <App />
    </ErrorBoundary>
  ),
  (() => {
    const app = document.createElement("div");
    document.body.append(app);
    return app;
  })()
);
