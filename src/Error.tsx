import { Component } from "solid-js";
import { log } from "./App";

const ErrorComponent: Component<{ error: any }> = (error) => {
  log("[ERROR]", error);
  return <div>{JSON.stringify(error)}</div>;
};

export default ErrorComponent;
