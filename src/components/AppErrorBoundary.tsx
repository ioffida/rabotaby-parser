"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

import { createAppLog, serializeAppLog, errorToLogFields } from "@/lib/logger";

type Props = { children: ReactNode };

type State = {
  error: Error | null;
  logText: string | null;
};

/**
 * Catches render errors in the subtree and exposes a machine-readable log for support.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, logText: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const log = createAppLog({
      source: "react-error-boundary",
      severity: "error",
      message: "Uncaught error in component tree",
      error: errorToLogFields(error),
    });
    return { error, logText: serializeAppLog(log) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const log = createAppLog({
      source: "react-error-boundary",
      severity: "error",
      message: "componentDidCatch",
      error: errorToLogFields(error),
      context: { componentStack: info.componentStack },
    });
    console.error(serializeAppLog(log));
  }

  private copyLog = async () => {
    if (!this.state.logText) return;
    await navigator.clipboard.writeText(this.state.logText);
  };

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-600">{this.state.error.message}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null, logText: null })}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.copyLog}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Copy debug log
            </button>
          </div>
          {this.state.logText ? (
            <pre className="max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-700">
              {this.state.logText}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
