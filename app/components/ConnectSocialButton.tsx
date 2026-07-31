"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface AccessRequest {
  requestId: string;
  approvalUrl: string;
  source: string;
  scopes: string[];
}

interface AccessStatus {
  status: string;
  personalServerUrl?: string;
  grantId?: string;
  scope?: string;
}

interface VanaResult {
  scope: string;
  data: unknown;
  payment?: unknown;
}

type ConnectState =
  | { type: "idle" }
  | { type: "creating"; platform: string }
  | { type: "awaiting_approval"; request: AccessRequest; popupBlocked: boolean }
  | { type: "reading"; request: AccessRequest }
  | { type: "done"; request: AccessRequest; result: VanaResult }
  | { type: "error"; error: Error };

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return body as T;
}

function useVanaConnect({ onResult }: { onResult?: (result: VanaResult) => void }) {
  const [state, setState] = useState<ConnectState>({ type: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearPoll();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setState({ type: "idle" });
  }, [clearPoll]);

  const connect = useCallback(async (source: string, scope: string) => {
    if (state.type !== "idle" && state.type !== "done" && state.type !== "error") return;

    clearPoll();
    setState({ type: "creating", platform: source });

    try {
      const request = await readJson<AccessRequest>("/api/vana/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, scopes: [scope] }),
      });
      setState({ type: "awaiting_approval", request, popupBlocked: false });

      const width = 520;
      const height = 720;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        request.approvalUrl,
        "vana-approval",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup || popup.closed) {
        setState({ type: "awaiting_approval", request, popupBlocked: true });
      } else {
        popupRef.current = popup;
      }

      pollRef.current = setInterval(async () => {
        try {
          const status = await readJson<AccessStatus>(
            `/api/vana/status?requestId=${encodeURIComponent(request.requestId)}&source=${source}&scope=${scope}`
          );

          if (status.status === "approved") {
            clearPoll();
            if (popupRef.current && !popupRef.current.closed) {
              popupRef.current.close();
            }
            setState({ type: "reading", request });

            const result = await readJson<VanaResult>(
              `/api/vana/data?requestId=${encodeURIComponent(request.requestId)}&source=${source}&scope=${scope}`
            );
            setState({ type: "done", request, result });
            onResult?.(result);
          } else if (status.status === "denied") {
            clearPoll();
            setState({ type: "error", error: new Error("Access request was denied by user") });
          }
        } catch (err) {
          // Keep polling
        }
      }, 1000);

      setTimeout(() => {
        if (pollRef.current) {
          clearPoll();
          setState({ type: "error", error: new Error("Approval timed out after 5 minutes") });
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      setState({ type: "error", error: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [state.type, clearPoll, onResult]);

  useEffect(() => {
    return () => clearPoll();
  }, [clearPoll]);

  return { state, connect, reset };
}

function stateLabel(stateType: string): string {
  switch (stateType) {
    case "creating": return "Creating access request...";
    case "awaiting_approval": return "Waiting for your approval...";
    case "reading": return "Reading your data...";
    case "done": return "Data ready!";
    case "error": return "Something went wrong";
    default: return "Ready to connect";
  }
}

export function ConnectSocialButton({ onResult }: { onResult?: (result: unknown) => void }) {
  const { state, connect, reset } = useVanaConnect({
    onResult: (result) => onResult?.(result.data),
  });

  const canStart = state.type === "idle" || state.type === "done" || state.type === "error";

  const handleInstagram = () => connect("instagram", "instagram.following");
  const handleGitHub = () => connect("github", "github.connections");

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          onClick={handleInstagram}
          disabled={!canStart}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", padding: "0.9rem 1.8rem", background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
        >
          {state.type === "creating" && state.platform === "instagram" && <span className="loading-spinner" />}
          📸 Instagram (Desktop)
        </button>

        <button
          className="btn btn-primary"
          onClick={handleGitHub}
          disabled={!canStart}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", padding: "0.9rem 1.8rem", background: "linear-gradient(135deg, #24292e, #586069)" }}
        >
          {state.type === "creating" && state.platform === "github" && <span className="loading-spinner" />}
          🐙 GitHub (Web)
        </button>
      </div>

      {state.type === "awaiting_approval" && (
        <div style={{ marginTop: "1.25rem" }}>
          <span className="status-badge pending">
            <span className="dot" />
            {state.popupBlocked ? (
              <>
                Popup blocked —{" "}
                <a href={state.request.approvalUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                  click here to approve
                </a>
              </>
            ) : (
              "Check the popup window for approval"
            )}
          </span>
        </div>
      )}

      {state.type === "reading" && (
        <div style={{ marginTop: "1.25rem" }}>
          <span className="status-badge pending">
            <span className="dot" />
            Reading encrypted data from your Personal Server...
          </span>
        </div>
      )}

      {state.type === "error" && (
        <div className="error-box" style={{ marginTop: "1.25rem", maxWidth: "500px", margin: "1.25rem auto 0" }}>
          <strong>Error:</strong> {state.error.message}
          <br />
          <button className="btn btn-secondary" onClick={reset} style={{ marginTop: "0.75rem" }}>
            Try Again
          </button>
        </div>
      )}

      {state.type === "done" && (
        <div style={{ marginTop: "1.25rem" }}>
          <span className="status-badge approved">
            <span className="dot" />
            Connected & analyzed
          </span>
          <button className="btn btn-secondary" onClick={reset} style={{ marginLeft: "0.75rem" }}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
