import affiliateApi from "../lib/affiliateApi";
import type { Commission, Page } from "./affiliateService";

// =================================================================
// Types proprios do portal
// =================================================================
export type AffiliateLoginRequest = {
  email: string;
  password: string;
};

export type AffiliateLoginResponse = {
  token: string;
  expiresInSeconds: number;
  affiliateId: string;
  name: string;
  email: string;
  refCode: string;
  status: string;
  mustChangePassword: boolean;
};

export type MeResponse = {
  id: string;
  name: string;
  email: string;
  refCode: string;
  whatsapp: string;
  status: string;
  mustChangePassword: boolean;
  pixKeyType: string | null;
  pixKey: string | null;
  commissionRate: number;
};

export type MonthlyBreakdown = {
  month: string;
  clientCount: number;
  commissionAmount: number;
  status: string;
};

export type DailyProduction = {
  date: string;
  decodes: number;
  commissionAmount: number;
};

export type DashboardResponse = {
  refCode: string;
  shareLink: string;
  commissionRate: number;
  decodesToday: number;
  decodesThisMonth: number;
  decodesTotal: number;
  activeClients: number;
  totalConversions: number;
  dailyEarned: number;
  currentMonthEstimate: number;
  lastMonthEarned: number;
  lifetimeEarned: number;
  pendingCarencia: number;
  readyForPayout: number;
  alreadyPaid: number;
  nextPayoutDate: string;
  productionTrend: DailyProduction[];
  lastSixMonths: MonthlyBreakdown[];
};

// =================================================================
// Endpoints
// =================================================================
export async function login(req: AffiliateLoginRequest): Promise<AffiliateLoginResponse> {
  const res = await affiliateApi.post<AffiliateLoginResponse>("/api/affiliate/auth/login", req);
  return res.data;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await affiliateApi.get<MeResponse>("/api/affiliate/me");
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await affiliateApi.post("/api/affiliate/me/change-password", { currentPassword, newPassword });
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await affiliateApi.get<DashboardResponse>("/api/affiliate/dashboard");
  return res.data;
}

export async function fetchMyCommissions(params: {
  page?: number;
  size?: number;
}): Promise<Page<Commission>> {
  const res = await affiliateApi.get<Page<Commission>>("/api/affiliate/commissions", { params });
  return res.data;
}

// =================================================================
// CRM (leads / interações) — escopo do afiliado
// =================================================================
export type AffiliateStats = {
  totalLeads: number;
  leadsWaiting: number;
  leadsMeeting: number;
  leadsProposal: number;
  totalInteractions: number;
  interactionsWaiting: number;
  interactionsAnswered: number;
  interactionsNoResponse: number;
};

export type AffiliateLead = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string | null;
  score: number;
  lastContactAt: string | null;
  source: string;
  stage: string;
  ownerUserId: string | null;
  ownerName: string | null;
  updatedAt: string;
};

export type AffiliateInteraction = {
  id: string;
  code: string;
  contactName: string;
  channel: string;
  city: string;
  status: string;
  ownerUserId: string | null;
  ownerName: string | null;
  leadId: string | null;
  leadCode: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
};

export async function fetchAffiliateStats(): Promise<AffiliateStats> {
  const res = await affiliateApi.get<AffiliateStats>("/api/affiliate/stats");
  return res.data;
}

export async function fetchAffiliateLeads(params: { q?: string; page?: number; size?: number }): Promise<Page<AffiliateLead>> {
  const res = await affiliateApi.get<Page<AffiliateLead>>("/api/affiliate/leads", { params });
  return res.data;
}

export async function createAffiliateLead(payload: Partial<AffiliateLead>): Promise<AffiliateLead> {
  const res = await affiliateApi.post<AffiliateLead>("/api/affiliate/leads", payload);
  return res.data;
}

export async function updateAffiliateLead(id: string, payload: Partial<AffiliateLead>): Promise<AffiliateLead> {
  const res = await affiliateApi.put<AffiliateLead>(`/api/affiliate/leads/${id}`, payload);
  return res.data;
}

export async function deleteAffiliateLead(id: string): Promise<void> {
  await affiliateApi.delete(`/api/affiliate/leads/${id}`);
}

export async function fetchAffiliateInteractions(params: { q?: string; page?: number; size?: number }): Promise<Page<AffiliateInteraction>> {
  const res = await affiliateApi.get<Page<AffiliateInteraction>>("/api/affiliate/interactions", { params });
  return res.data;
}

export async function createAffiliateInteraction(payload: Partial<AffiliateInteraction>): Promise<AffiliateInteraction> {
  const res = await affiliateApi.post<AffiliateInteraction>("/api/affiliate/interactions", payload);
  return res.data;
}

export async function updateAffiliateInteraction(id: string, payload: Partial<AffiliateInteraction>): Promise<AffiliateInteraction> {
  const res = await affiliateApi.put<AffiliateInteraction>(`/api/affiliate/interactions/${id}`, payload);
  return res.data;
}

export async function deleteAffiliateInteraction(id: string): Promise<void> {
  await affiliateApi.delete(`/api/affiliate/interactions/${id}`);
}
