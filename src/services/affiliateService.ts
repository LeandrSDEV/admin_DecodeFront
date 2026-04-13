import api from "../lib/api";

// =================================================================
// Types
// =================================================================
export type AffiliateStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED";
export type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "REVERSED" | "HELD";
export type PayoutRunStatus = "DRAFT" | "REVIEWED" | "EXECUTING" | "COMPLETED" | "CANCELLED";

export type Affiliate = {
  id: string;
  refCode: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf: string | null;
  city: string | null;
  state: string | null;
  pixKeyType: string | null;
  pixKey: string | null;
  status: AffiliateStatus;
  customCommissionRate: number | null;
  lastLoginAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  totalReferrals: number;
  activeClients: number;
  totalEarned: number;
  pendingAmount: number;
};

export type AffiliateCreateRequest = {
  name: string;
  email: string;
  whatsapp: string;
  cpf?: string;
  city?: string;
  state?: string;
  pixKeyType?: string;
  pixKey?: string;
  refCode?: string;
  customCommissionRate?: number;
  initialPassword?: string;
  decodeId?: string;
};

export type AffiliateUpdateRequest = Partial<{
  name: string;
  whatsapp: string;
  cpf: string;
  city: string;
  state: string;
  pixKeyType: string;
  pixKey: string;
  status: AffiliateStatus;
  customCommissionRate: number;
  notes: string;
}>;

export type AffiliateApproveRequest = {
  initialPassword: string;
  notes?: string;
};

export type Commission = {
  id: string;
  affiliateId: string;
  affiliateName: string;
  decodeId: string;
  decodeName: string;
  referenceMonth: string;
  planName: string;
  planPrice: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  carenciaUntil: string;
  payoutRunId: string | null;
  paidAt: string | null;
  paidReference: string | null;
  notes: string | null;
};

export type PayoutRun = {
  id: string;
  referenceMonth: string;
  totalAffiliates: number;
  totalCommissions: number;
  totalAmount: number;
  status: PayoutRunStatus;
  generatedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  notes: string | null;
};

export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

// =================================================================
// CRUD afiliados
// =================================================================
export async function listAffiliates(params: {
  q?: string;
  status?: AffiliateStatus;
  page?: number;
  size?: number;
}): Promise<Page<Affiliate>> {
  const res = await api.get<Page<Affiliate>>("/api/admin/affiliates", { params });
  return res.data;
}

export async function getAffiliate(id: string): Promise<Affiliate> {
  const res = await api.get<Affiliate>(`/api/admin/affiliates/${id}`);
  return res.data;
}

export async function createAffiliate(req: AffiliateCreateRequest): Promise<Affiliate> {
  const res = await api.post<Affiliate>("/api/admin/affiliates", req);
  return res.data;
}

export async function updateAffiliate(id: string, req: AffiliateUpdateRequest): Promise<Affiliate> {
  const res = await api.put<Affiliate>(`/api/admin/affiliates/${id}`, req);
  return res.data;
}

export async function approveAffiliate(id: string, req: AffiliateApproveRequest): Promise<Affiliate> {
  const res = await api.post<Affiliate>(`/api/admin/affiliates/${id}/approve`, req);
  return res.data;
}

export async function deleteAffiliate(id: string): Promise<void> {
  await api.delete(`/api/admin/affiliates/${id}`);
}

export async function suspendAffiliate(id: string, reason: string): Promise<void> {
  await api.post(`/api/admin/affiliates/${id}/suspend`, { reason });
}

export async function reactivateAffiliate(id: string): Promise<void> {
  await api.post(`/api/admin/affiliates/${id}/reactivate`);
}

// =================================================================
// Comissoes
// =================================================================
export async function listAffiliateCommissions(
  affiliateId: string,
  params: { page?: number; size?: number }
): Promise<Page<Commission>> {
  const res = await api.get<Page<Commission>>(
    `/api/admin/affiliates/${affiliateId}/commissions`,
    { params }
  );
  return res.data;
}

export async function estimateAffiliate(affiliateId: string): Promise<{
  affiliateId: string;
  currentMonth: string;
  estimateAmount: number;
}> {
  const res = await api.get(`/api/admin/affiliates/${affiliateId}/commissions/estimate`);
  return res.data;
}

export async function generateCommissionsForMonth(month: string): Promise<{
  month: string;
  created: number;
}> {
  const res = await api.post("/api/admin/affiliates/commissions/generate", null, {
    params: { month },
  });
  return res.data;
}

export async function markCommissionPaid(
  commissionId: string,
  paidReference: string,
  notes?: string
): Promise<void> {
  await api.post(`/api/admin/affiliates/commissions/${commissionId}/mark-paid`, {
    paidReference,
    notes,
  });
}

// =================================================================
// Payout runs
// =================================================================
export async function listPayoutRuns(params: { page?: number; size?: number }): Promise<Page<PayoutRun>> {
  const res = await api.get<Page<PayoutRun>>("/api/admin/affiliates/payout-runs", { params });
  return res.data;
}

export async function getPayoutRun(runId: string): Promise<PayoutRun> {
  const res = await api.get<PayoutRun>(`/api/admin/affiliates/payout-runs/${runId}`);
  return res.data;
}

export async function getPayoutRunCommissions(runId: string): Promise<Commission[]> {
  const res = await api.get<Commission[]>(
    `/api/admin/affiliates/payout-runs/${runId}/commissions`
  );
  return res.data;
}

export async function createPayoutRun(month: string): Promise<PayoutRun> {
  const res = await api.post<PayoutRun>("/api/admin/affiliates/payout-runs", null, {
    params: { month },
  });
  return res.data;
}

export async function reviewPayoutRun(runId: string): Promise<PayoutRun> {
  const res = await api.post<PayoutRun>(`/api/admin/affiliates/payout-runs/${runId}/review`);
  return res.data;
}

export async function executePayoutRun(runId: string): Promise<PayoutRun> {
  const res = await api.post<PayoutRun>(`/api/admin/affiliates/payout-runs/${runId}/execute`);
  return res.data;
}

export async function cancelPayoutRun(runId: string, reason: string): Promise<PayoutRun> {
  const res = await api.post<PayoutRun>(`/api/admin/affiliates/payout-runs/${runId}/cancel`, {
    reason,
  });
  return res.data;
}
