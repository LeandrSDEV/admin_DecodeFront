import api from "../lib/api";

export type BridgeStatus = {
  enabled: boolean;
  instance: string;
  reachable: boolean;
  message?: string | null;
  bridgeStatus?: string | null;
  connectionStatus?: string | null;
  connectedPhone?: string | null;
  connectedName?: string | null;
  qrCodeDataUrl?: string | null;
  qrExpiresAt?: string | null;
  pairingCode?: string | null;
  pairingCodeExpiresAt?: string | null;
  lastEvent?: string | null;
  lastEventAt?: string | null;
  updatedAt?: string | null;
  queueSize?: number;
  lastSuccessfulSendAt?: string | null;
  lastSendFailureCount?: number;
};

export type BridgeCommandResponse = {
  ok?: boolean;
  status?: string;
  message?: string;
  instance?: string;
};

export async function fetchBridgeStatus(): Promise<BridgeStatus> {
  const res = await api.get<BridgeStatus>("/api/admin/bridge/status");
  return res.data;
}

export async function connectBridge(): Promise<BridgeCommandResponse> {
  const res = await api.post<BridgeCommandResponse>("/api/admin/bridge/connect");
  return res.data;
}

export async function restartBridge(): Promise<BridgeCommandResponse> {
  const res = await api.post<BridgeCommandResponse>("/api/admin/bridge/restart");
  return res.data;
}

export async function newBridgeQr(): Promise<BridgeCommandResponse> {
  const res = await api.post<BridgeCommandResponse>("/api/admin/bridge/new-qr");
  return res.data;
}

export async function disconnectBridge(): Promise<BridgeCommandResponse> {
  const res = await api.post<BridgeCommandResponse>("/api/admin/bridge/disconnect");
  return res.data;
}

export async function logoutBridge(): Promise<BridgeCommandResponse> {
  const res = await api.post<BridgeCommandResponse>("/api/admin/bridge/logout");
  return res.data;
}
