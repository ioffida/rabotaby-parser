"use client";

import type { ReactNode } from "react";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
