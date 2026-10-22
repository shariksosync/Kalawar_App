"use client";

import React from "react";
import App from "@/components/portal/App";
import { AppContextProvider } from "@/components/portal/context/AppContext";

export default function UnifiedPortalRootPage() {
  return (
    <AppContextProvider>
      <App />
    </AppContextProvider>
  );
}
