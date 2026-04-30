"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const FALLBACK_URL = "https://basic-walrus-51.convex.cloud";
const rawUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? FALLBACK_URL;
const url = rawUrl.trim();

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (!url || !/^https?:\/\//.test(url)) return null;
    try {
      return new ConvexReactClient(url);
    } catch {
      return null;
    }
  }, []);

  if (!client) {
    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
