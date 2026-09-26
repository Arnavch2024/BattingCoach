"use client";

import { useEffect, ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (!posthogKey) {
      return;
    }

    if (typeof window !== "undefined" && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "[data-private]",
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
