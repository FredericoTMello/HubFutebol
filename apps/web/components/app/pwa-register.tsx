"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const clearLegacyCaches = async () => {
      if (!("caches" in window)) return;
      const keys = await window.caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("hubfutebol-")).map((key) => window.caches.delete(key)));
    };

    const cleanupServiceWorkers = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      await clearLegacyCaches();
    };

    cleanupServiceWorkers().catch(() => {
      // ignore cleanup failures in development and restricted browsers
    });
  }, []);

  return null;
}

