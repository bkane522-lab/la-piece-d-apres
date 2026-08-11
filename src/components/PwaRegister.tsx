"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // L'application reste utilisable même si le service worker échoue.
      });
    }
  }, []);

  return null;
}
