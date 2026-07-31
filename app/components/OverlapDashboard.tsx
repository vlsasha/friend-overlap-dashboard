"use client";

import { useMemo } from "react";

interface Contact {
  name: string;
  raw: unknown;
  platform: "instagram" | "linkedin";
  url?: string;
  meta?: string;
}

interface OverlapResult {
  instagramOnly: Contact[];
  linkedinOnly: Contact[];
  both: Contact[];
  stats: {
    instagramTotal: number;
    linkedinTotal: number;
    overlapCount: number;
    overlapPercent: number;
  };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function extractContacts(data: unknown, platform: "instagram" | "linkedin"): Contact[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const contacts: Contact[] = [];

  if (platform === "instagram") {
    const following = Array.isArray(record.following) ? record.following : Array.isArray(record.followers) ? record.followers : [];
    for (const item of following) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const name = String(it.fullName ?? it.name ?? it.displayName ?? it.username ?? "");
      if (!name) continue;
      contacts.push({
        name,
        raw: item,
        platform: "instagram",
        url: String(it.profileUrl ?? it.url ?? ""),
        meta: String(it.username ?? ""),
      });
    }
  } else {
    const connections = Array.isArray(record.connections) ? record.connections : [];
    for (const item of connections) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const name = String(it.fullName ?? it.name ?? "");
      if (!name) continue;
      contacts.push({
        name,
        raw: item,
        platform: "linkedin",
        url: String(it.profileUrl ?? it.url ?? ""),
        meta: String(it.headline ?? ""),
      });
    }
  }

  return contacts;
}

function analyzeOverlap(instagramData: unknown, linkedinData: unknown): OverlapResult {
  const igContacts = extractContacts(instagramData, "instagram");
  const liContacts = extractContacts(linkedinData, "linkedin");

  const igNames = new Map<string, Contact>();
  for (const c of igContacts) {
    igNames.set(normalizeName(c.name), c);
  }

  const both: Contact[] = [];
  const linkedinOnly: Contact[] = [];

  for (const c of liContacts) {
    const normalized = normalizeName(c.name);
    if (igNames.has(normalized)) {
      both.push(c);
      igNames.delete(normalized);
    } else {
      linkedinOnly.push(c);
    }
  }

  const instagramOnly = Array.from(igNames.values());

  const igTotal = igContacts.length;
  const liTotal = liContacts.length;
  const overlap = both.length;
  const overlapPercent = igTotal > 0 ? Math.round((overlap / igTotal) * 100) : 0;

  return {
    instagramOnly,
    linkedinOnly,
    both,
    stats: {
      instagramTotal: igTotal,
      linkedinTotal: liTotal,
      overlapCount: overlap,
      overlapPercent,
    },
  };
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = ["#e94560", "#00a0dc", "#fcb045", "#48bb78", "#9f7aea", "#ed8936"];
  const color = colors[name.length % colors.length];
  return (
    <div className="contact-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
      {initial}
    </div>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <li className="contact-item">
      <Avatar name={contact.name} />
      <div className="contact-info">
        <div className="contact-name">{contact.name}</div>
        {contact.meta && <div className="contact-meta">{contact.meta}</div>}
      </div>
    </li>
  );
}

export function OverlapDashboard({ data }: { data: Record<string, unknown> }) {
  const result = useMemo(() => {
    const instagramData = data["instagram.following"] ?? data["instagram"] ?? {};
    const linkedinData = data["linkedin.connections"] ?? data["linkedin"] ?? {};
    return analyzeOverlap(instagramData, linkedinData);
  }, [data]);

  const { stats, both, instagramOnly, linkedinOnly } = result;

  return (
    <div className="dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{stats.instagramTotal}</div>
          <div className="label">Instagram Following</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.linkedinTotal}</div>
          <div className="label">LinkedIn Connections</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--success)" }}>{stats.overlapCount}</div>
          <div className="label">Mutual Contacts</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--warning)" }}>{stats.overlapPercent}%</div>
          <div className="label">Overlap Rate</div>
        </div>
      </div>

      {/* Venn Diagram */}
      <div className="venn-section">
        <h3>🎯 Platform Overlap</h3>
        <div className="venn-diagram">
          <div className="venn-circle instagram">
            <span>Instagram</span>
            <strong>{stats.instagramTotal}</strong>
          </div>
          <div className="venn-overlap">{stats.overlapCount}</div>
          <div className="venn-circle linkedin">
            <span>LinkedIn</span>
            <strong>{stats.linkedinTotal}</strong>
          </div>
        </div>
      </div>

      {/* Overlap Table */}
      {both.length > 0 && (
        <div className="venn-section">
          <h3>👥 People You Know on Both Platforms</h3>
          <table className="overlap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Instagram Handle</th>
                <th>LinkedIn Headline</th>
              </tr>
            </thead>
            <tbody>
              {both.map((contact, i) => {
                const raw = contact.raw as Record<string, unknown>;
                const igUsername = raw && typeof raw === "object" && "username" in raw ? String(raw.username) : "—";
                const liHeadline = raw && typeof raw === "object" && "headline" in raw ? String(raw.headline).slice(0, 40) + (String(raw.headline).length > 40 ? "..." : "") : "—";
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{contact.name}</td>
                    <td><span className="platform-tag instagram">@{igUsername}</span></td>
                    <td><span className="platform-tag linkedin">{liHeadline}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {both.length === 0 && (
        <div className="venn-section" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>🔍 No Overlaps Found</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Your Instagram and LinkedIn networks don&apos;t share any contacts by name.
            <br />
            This could mean your networks are distinct, or names differ between platforms.
          </p>
        </div>
      )}

      {/* Platform breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div className="source-section">
          <h3>
            <span style={{ color: "#fcb045" }}>📸</span> Instagram Only ({instagramOnly.length})
          </h3>
          <ul className="contact-list">
            {instagramOnly.slice(0, 30).map((c, i) => (
              <ContactCard key={i} contact={c} />
            ))}
            {instagramOnly.length > 30 && (
              <li className="contact-item" style={{ color: "var(--text-secondary)", justifyContent: "center", padding: "1rem" }}>
                +{instagramOnly.length - 30} more contacts
              </li>
            )}
          </ul>
        </div>

        <div className="source-section">
          <h3>
            <span style={{ color: "#00a0dc" }}>💼</span> LinkedIn Only ({linkedinOnly.length})
          </h3>
          <ul className="contact-list">
            {linkedinOnly.slice(0, 30).map((c, i) => (
              <ContactCard key={i} contact={c} />
            ))}
            {linkedinOnly.length > 30 && (
              <li className="contact-item" style={{ color: "var(--text-secondary)", justifyContent: "center", padding: "1rem" }}>
                +{linkedinOnly.length - 30} more contacts
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
