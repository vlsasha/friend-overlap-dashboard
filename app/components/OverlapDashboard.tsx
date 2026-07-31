"use client";

import { useMemo, useState } from "react";

interface Contact {
  name: string;
  raw: Record<string, unknown>;
  platform: string;
  url?: string;
  meta?: string;
}

interface AnalysisResult {
  contacts: Contact[];
  total: number;
  platform: string;
  topMeta: string[];
}

function extractContacts(data: unknown, platform: string): Contact[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const contacts: Contact[] = [];

  if (platform === "instagram") {
    const following = Array.isArray(record.following) ? record.following : [];
    for (const item of following) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      contacts.push({
        name: String(it.fullName ?? it.name ?? it.username ?? ""),
        raw: it,
        platform: "instagram",
        url: String(it.profileUrl ?? ""),
        meta: String(it.username ?? ""),
      });
    }
  } else if (platform === "github") {
    const connections = Array.isArray(record.connections) ? record.connections : [];
    for (const item of connections) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      contacts.push({
        name: String(it.fullName ?? it.name ?? it.login ?? ""),
        raw: it,
        platform: "github",
        url: String(it.profileUrl ?? it.htmlUrl ?? ""),
        meta: String(it.bio ?? it.headline ?? it.company ?? ""),
      });
    }
  }

  return contacts.filter((c) => c.name);
}

function analyzeData(data: unknown, platform: string): AnalysisResult {
  const contacts = extractContacts(data, platform);
  const metas = contacts.map((c) => c.meta).filter(Boolean) as string[];
  const topMeta = metas.slice(0, 5);

  return {
    contacts,
    total: contacts.length,
    platform,
    topMeta,
  };
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = ["#e94560", "#fcb045", "#48bb78", "#9f7aea", "#00a0dc", "#ed8936", "#24292e"];
  const color = colors[name.length % colors.length];
  return (
    <div className="contact-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
      {initial}
    </div>
  );
}

export function OverlapDashboard({ data }: { data: Record<string, unknown> }) {
  const [search, setSearch] = useState("");

  // Detect platform from data keys
  const platform = useMemo(() => {
    if (data["instagram.following"]) return "instagram";
    if (data["github.connections"]) return "github";
    return "instagram";
  }, [data]);

  const rawData = data[`${platform}.following`] ?? data[`${platform}.connections`] ?? data[platform] ?? {};

  const analysis = useMemo(() => {
    return analyzeData(rawData, platform);
  }, [rawData, platform]);

  const filtered = useMemo(() => {
    if (!search.trim()) return analysis.contacts;
    const q = search.toLowerCase();
    return analysis.contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.meta ?? "").toLowerCase().includes(q)
    );
  }, [analysis.contacts, search]);

  const isInstagram = platform === "instagram";
  const isGitHub = platform === "github";

  return (
    <div className="dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{analysis.total}</div>
          <div className="label">{isInstagram ? "Following" : "Connections"}</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--success)" }}>{filtered.length}</div>
          <div className="label">Shown</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: isInstagram ? "#fcb045" : "#586069" }}>
            {platform === "instagram" ? "📸" : "🐙"}
          </div>
          <div className="label">{isInstagram ? "Instagram" : "GitHub"}</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--info)" }}>{analysis.topMeta.length}</div>
          <div className="label">With Bio/Handle</div>
        </div>
      </div>

      {/* Search */}
      <div className="venn-section">
        <h3>🔍 Search {isInstagram ? "Following" : "Connections"}</h3>
        <input
          type="text"
          placeholder={isInstagram ? "Type username or name..." : "Type name or login..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "1rem",
            outline: "none",
            marginTop: "0.5rem",
          }}
        />
      </div>

      {/* Contact List */}
      <div className="venn-section">
        <h3>{isInstagram ? "📸 Instagram Following" : "🐙 GitHub Connections"} ({filtered.length} shown)</h3>
        <ul className="contact-list">
          {filtered.map((contact, i) => (
            <li key={i} className="contact-item">
              <Avatar name={contact.name} />
              <div className="contact-info">
                <div className="contact-name">{contact.name}</div>
                {contact.meta && (
                  <div className="contact-meta">{isInstagram ? "@" : ""}{contact.meta}</div>
                )}
              </div>
              {contact.url && (
                <a
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "auto",
                    color: "var(--accent)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View →
                </a>
              )}
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
            No contacts match your search.
          </p>
        )}
      </div>
    </div>
  );
}
