import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async" // ✅ import HelmetProvider
import "./index.css"
import App from "./App"

const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <HelmetProvider> {/* wrap the app */}
    <BrowserRouter>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </BrowserRouter>
  </HelmetProvider>
)
