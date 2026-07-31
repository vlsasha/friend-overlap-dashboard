"use client";

import { useMemo, useState } from "react";

interface IgContact {
  username: string;
  fullName: string;
  profileUrl: string;
}

interface IgAnalysis {
  contacts: IgContact[];
  total: number;
  topUsernames: string[];
  nameLengths: { short: number; medium: number; long: number };
}

function extractFollowing(data: unknown): IgContact[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const following = Array.isArray(record.following) ? record.following : [];
  const contacts: IgContact[] = [];

  for (const item of following) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    contacts.push({
      username: String(it.username ?? ""),
      fullName: String(it.fullName ?? it.name ?? it.displayName ?? ""),
      profileUrl: String(it.profileUrl ?? it.url ?? ""),
    });
  }

  return contacts.filter((c) => c.username || c.fullName);
}

function analyzeFollowing(data: unknown): IgAnalysis {
  const contacts = extractFollowing(data);
  const nameLengths = { short: 0, medium: 0, long: 0 };

  for (const c of contacts) {
    const len = c.fullName.length;
    if (len <= 8) nameLengths.short++;
    else if (len <= 15) nameLengths.medium++;
    else nameLengths.long++;
  }

  const topUsernames = contacts
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .slice(0, 5)
    .map((c) => c.username);

  return {
    contacts,
    total: contacts.length,
    topUsernames,
    nameLengths,
  };
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = ["#e94560", "#fcb045", "#48bb78", "#9f7aea", "#00a0dc", "#ed8936"];
  const color = colors[name.length % colors.length];
  return (
    <div className="contact-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
      {initial}
    </div>
  );
}

export function OverlapDashboard({ data }: { data: Record<string, unknown> }) {
  const [search, setSearch] = useState("");

  const analysis = useMemo(() => {
    const igData = data["instagram.following"] ?? data["instagram"] ?? {};
    return analyzeFollowing(igData);
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return analysis.contacts;
    const q = search.toLowerCase();
    return analysis.contacts.filter(
      (c) => c.username.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q)
    );
  }, [analysis.contacts, search]);

  const { total, nameLengths } = analysis;

  return (
    <div className="dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{total}</div>
          <div className="label">Total Following</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--success)" }}>{nameLengths.short}</div>
          <div className="label">Short Names (≤8)</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--warning)" }}>{nameLengths.medium}</div>
          <div className="label">Medium Names (9–15)</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--info)" }}>{nameLengths.long}</div>
          <div className="label">Long Names (16+)</div>
        </div>
      </div>

      {/* Search */}
      <div className="venn-section">
        <h3>🔍 Search Your Following</h3>
        <input
          type="text"
          placeholder="Type username or name..."
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
        <h3>📸 Instagram Following ({filtered.length} shown)</h3>
        <ul className="contact-list">
          {filtered.map((contact, i) => (
            <li key={i} className="contact-item">
              <Avatar name={contact.fullName || contact.username} />
              <div className="contact-info">
                <div className="contact-name">{contact.fullName || contact.username}</div>
                {contact.username && contact.fullName && contact.username !== contact.fullName && (
                  <div className="contact-meta">@{contact.username}</div>
                )}
              </div>
              {contact.profileUrl && (
                <a
                  href={contact.profileUrl}
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
