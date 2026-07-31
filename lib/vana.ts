import "server-only";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import {
  createDirectDataController,
  dataPathForScope,
  type AccessRequestClient,
  type AccessRequestStatus,
  type DirectDataController,
  type DirectEnv,
  type DirectNetwork,
  type PersonalServerFetch,
  type FetchResponseLike,
} from "@opendatalabs/vana-sdk/server";

// ── Sample mode constants ──
const SAMPLE_APP_PRIVATE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const SAMPLE_REQUEST_ID = "friend_overlap_mainnet";
const SAMPLE_GRANT_ID =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

const SOURCE = "social";
const DEFAULT_SCOPES = "instagram.following,linkedin.connections";

const DEFAULT_SAMPLE_FIXTURES: Record<string, string> = {
  "instagram.following": "fixtures/instagram.following.json",
  "linkedin.connections": "fixtures/linkedin.connections.json",
};

type VanaMode = "sample" | "live";

export interface AppInfo {
  appAddress: string;
  appId: string;
  appName: string;
  appUrl: string;
  mode: VanaMode;
  network: DirectNetwork;
  scopes: string[];
  source: string;
}

function appUrl(): string {
  return process.env.VANA_APP_URL ?? "http://localhost:3000";
}

function appConfig() {
  return {
    id: "friend-overlap",
    name: "Friend Overlap Dashboard",
    homepageUrl: appUrl(),
  };
}

function vanaMode(): VanaMode {
  return process.env.VANA_MODE === "live" ? "live" : "sample";
}

function directEnv(): DirectEnv {
  return process.env.VANA_ENV === "dev" ? "dev" : "production";
}

function directNetwork(): DirectNetwork {
  return process.env.VANA_NETWORK === "mainnet" ? "mainnet" : "moksha";
}

function scopes(): string[] {
  return (process.env.VANA_SCOPES ?? DEFAULT_SCOPES)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEndpoints(): Partial<Record<string, string>> | undefined {
  const endpoints: Partial<Record<string, string>> = {};
  if (process.env.VANA_ACCESS_REQUEST_BASE_URL) {
    endpoints.accessRequestBaseUrl = process.env.VANA_ACCESS_REQUEST_BASE_URL;
  }
  if (process.env.VANA_APPROVAL_APP_BASE_URL) {
    endpoints.approvalAppBaseUrl = process.env.VANA_APPROVAL_APP_BASE_URL;
  }
  if (process.env.VANA_DP_RPC_URL) {
    endpoints.escrowGatewayUrl = process.env.VANA_DP_RPC_URL;
  }
  return Object.keys(endpoints).length > 0 ? endpoints : undefined;
}

async function loadSampleDataForScope(scope: string): Promise<unknown> {
  const envKey = `VANA_SAMPLE_DATA_PATH_${scope.replace(/\./g, "_").toUpperCase()}`;
  let localPath = process.env[envKey] ?? process.env.VANA_SAMPLE_DATA_PATH;

  if (!localPath && DEFAULT_SAMPLE_FIXTURES[scope]) {
    localPath = DEFAULT_SAMPLE_FIXTURES[scope];
  }

  if (localPath) {
    const samplePath = isAbsolute(localPath)
      ? localPath
      : resolve(process.env.INIT_CWD ?? process.cwd(), localPath);
    try {
      return JSON.parse(await readFile(samplePath, "utf8")) as unknown;
    } catch (e) {
      console.warn(`[Sample] Failed to load fixture for ${scope}: ${e}`);
    }
  }

  const url = process.env.VANA_SAMPLE_DATA_URL;
  if (url) {
    const response = await fetch(url);
    if (response.ok) return (await response.json()) as unknown;
  }

  return generateSyntheticFixture(scope);
}

function generateSyntheticFixture(scope: string): unknown {
  if (scope === "instagram.following") {
    return {
      following: [
        { username: "alice_design", fullName: "Alice Chen", profileUrl: "https://instagram.com/alice_design" },
        { username: "bob_codes", fullName: "Bob Smith", profileUrl: "https://instagram.com/bob_codes" },
        { username: "carla_travels", fullName: "Carla Jones", profileUrl: "https://instagram.com/carla_travels" },
        { username: "david_photo", fullName: "David Lee", profileUrl: "https://instagram.com/david_photo" },
        { username: "emma_art", fullName: "Emma Wilson", profileUrl: "https://instagram.com/emma_art" },
        { username: "frank_tech", fullName: "Frank Miller", profileUrl: "https://instagram.com/frank_tech" },
        { username: "grace_yoga", fullName: "Grace Hopper", profileUrl: "https://instagram.com/grace_yoga" },
        { username: "henry_food", fullName: "Henry Ford", profileUrl: "https://instagram.com/henry_food" },
        { username: "ivy_music", fullName: "Ivy Rose", profileUrl: "https://instagram.com/ivy_music" },
        { username: "jack_skate", fullName: "Jack Black", profileUrl: "https://instagram.com/jack_skate" },
      ],
    };
  }
  if (scope === "linkedin.connections") {
    return {
      connections: [
        { fullName: "Alice Chen", headline: "Product Designer at TechCo", profileUrl: "https://linkedin.com/in/alicechen", dateConnected: "2024-01-15" },
        { fullName: "Bob Smith", headline: "Software Engineer at StartupX", profileUrl: "https://linkedin.com/in/bobsmith", dateConnected: "2023-11-20" },
        { fullName: "Carla Jones", headline: "Travel Blogger & Content Creator", profileUrl: "https://linkedin.com/in/carlagones", dateConnected: "2024-02-10" },
        { fullName: "David Lee", headline: "Photographer | Visual Artist", profileUrl: "https://linkedin.com/in/davidlee", dateConnected: "2023-09-05" },
        { fullName: "Emma Wilson", headline: "Art Director at CreativeAgency", profileUrl: "https://linkedin.com/in/emmawilson", dateConnected: "2024-03-01" },
        { fullName: "Frank Miller", headline: "CTO at BigCorp", profileUrl: "https://linkedin.com/in/frankmiller", dateConnected: "2024-03-10" },
        { fullName: "Grace Hopper", headline: "Engineering Manager at TechGiant", profileUrl: "https://linkedin.com/in/gracehopper", dateConnected: "2024-02-05" },
        { fullName: "Kevin Space", headline: "Data Scientist at AI Labs", profileUrl: "https://linkedin.com/in/kevinspace", dateConnected: "2024-04-12" },
        { fullName: "Laura Moon", headline: "Marketing Director", profileUrl: "https://linkedin.com/in/lauramoon", dateConnected: "2024-01-20" },
        { fullName: "Mike Ross", headline: "Legal Consultant", profileUrl: "https://linkedin.com/in/mikeross", dateConnected: "2023-12-15" },
      ],
    };
  }
  return {};
}

function jsonResponse(body: unknown, status = 200): FetchResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function createSampleAccessClient(): AccessRequestClient {
  const primaryScope = scopes()[0] ?? "instagram.following";
  const approvedStatus: AccessRequestStatus = {
    status: "approved",
    personalServerUrl: "https://personal-server.local.test",
    grantId: SAMPLE_GRANT_ID,
    scope: primaryScope,
  };

  return {
    async createAccessRequest({ appAddress, returnUrl }) {
      return {
        requestId: SAMPLE_REQUEST_ID,
        approvalUrl: returnUrl,
        appAddress,
      };
    },
    async getAccessRequestStatus() {
      return approvedStatus;
    },
    async acknowledgeRead() {
      // No-op in sample mode
    },
  };
}

function createSamplePersonalServerFetch(): PersonalServerFetch {
  return async (input, init) => {
    const allScopes = scopes();
    const matchedScope = allScopes.find((s) => input.endsWith(dataPathForScope(s)));
    if (!matchedScope) {
      return jsonResponse({ error: "Unknown sample data route" }, 404);
    }
    if (!init?.headers?.Authorization) {
      return jsonResponse({ error: "Missing Web3Signed auth" }, 401);
    }
    return jsonResponse(await loadSampleDataForScope(matchedScope));
  };
}

function createConfiguredController(): DirectDataController {
  const mode = vanaMode();
  const shared = {
    app: appConfig(),
    source: SOURCE,
    scopes: scopes(),
  };

  if (mode === "sample") {
    return createDirectDataController({
      ...shared,
      network: "moksha",
      appPrivateKey: SAMPLE_APP_PRIVATE_KEY,
      accessRequestClient: createSampleAccessClient(),
      personalServerFetch: createSamplePersonalServerFetch(),
    });
  }

  return createDirectDataController({
    ...shared,
    env: directEnv(),
    network: directNetwork(),
    appPrivateKey: requireEnv("VANA_APP_PRIVATE_KEY"),
    endpoints: optionalEndpoints(),
  });
}

let controller: DirectDataController | undefined;

export function getVanaController(): DirectDataController {
  controller ??= createConfiguredController();
  return controller;
}

export function getAppInfo(): AppInfo {
  const mode = vanaMode();
  const app = appConfig();
  let appAddress = "Set VANA_APP_PRIVATE_KEY";

  if (mode === "sample") {
    appAddress = getVanaController().getAppAddress();
  } else if (process.env.VANA_APP_PRIVATE_KEY) {
    appAddress = getVanaController().getAppAddress();
  }

  return {
    appAddress,
    appId: app.id,
    appName: app.name,
    appUrl: app.homepageUrl,
    mode,
    network: directNetwork(),
    scopes: scopes(),
    source: SOURCE,
  };
}

export function returnUrlFromRequest(requestUrl: string): string {
  return new URL("/connect/return", process.env.VANA_APP_URL ?? requestUrl).toString();
}
