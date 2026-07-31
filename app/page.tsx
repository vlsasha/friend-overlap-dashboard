"use client";

import { useState } from "react";
import { ConnectSocialButton } from "./components/ConnectSocialButton";
import { OverlapDashboard } from "./components/OverlapDashboard";
import "./globals.css";

export default function Home() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  return (
    <main className="container">
      <header className="header">
        <img 
          src="/logo.svg" 
          alt="Friend Overlap Dashboard" 
          style={{ maxWidth: '320px', width: '100%', height: 'auto', marginBottom: '1rem' }} 
        />
        <p>Analyze your Instagram network with Vana Data Portability</p>
      </header>

      <section className="connect-section">
        <ConnectSocialButton onResult={(result) => setData(result as Record<string, unknown>)} />
      </section>

      {data && <OverlapDashboard data={data} />}

      {!data && (
        <div className="info-section">
          <h3>🔒 How it works</h3>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-text">
                <strong>Request</strong>
                <span>Your app asks Vana for access to your Instagram data</span>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-text">
                <strong>Approve</strong>
                <span>You grant permission in your Vana Account — data stays encrypted on your device</span>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-text">
                <strong>Analyze</strong>
                <span>We read your following list and show insights — every access is logged on-chain</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
