"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConnectReturn() {
  const router = useRouter();

  useEffect(() => {
    if (window.opener) {
      window.opener.focus();
      window.close();
    }
  }, [router]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#0a0a1a",
      color: "#e2e8f0",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <h2 style={{ margin: 0 }}>✅ Approval complete</h2>
      <p style={{ color: "#94a3b8", margin: 0 }}>
        Return to the original tab to see your data.
      </p>
      <button 
        onClick={() => router.push("/")}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, #e94560, #ff6b6b)",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          marginTop: "0.5rem"
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
