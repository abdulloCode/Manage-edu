import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";
import { authStore } from "./store/auth";
import { LangProvider } from "./context/LangContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={authStore}>
      <LangProvider>
        <App />
      </LangProvider>
    </Provider>
  </React.StrictMode>,
);
