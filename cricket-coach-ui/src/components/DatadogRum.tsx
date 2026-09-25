"use client";

import { useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";

export function DatadogRum() {
  useEffect(() => {
    const applicationId = process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID;
    const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
    const site = process.env.NEXT_PUBLIC_DATADOG_SITE || "us5.datadoghq.com";
    const service = process.env.NEXT_PUBLIC_DATADOG_SERVICE || "batcoach-ui";
    const env = process.env.NEXT_PUBLIC_DATADOG_ENV || process.env.NODE_ENV || "development";

    // Only initialize if keys are configured
    if (!applicationId || !clientToken) {
      return;
    }

    // Prevent duplicate initialization in React 18/19 StrictMode
    if (datadogRum.getInternalContext()) {
      return;
    }

    datadogRum.init({
      applicationId,
      clientToken,
      site,
      service,
      env,
      version: "2.0.0",
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: "mask-user-input",
    });

    datadogRum.startSessionReplayRecording();
  }, []);

  return null;
}
