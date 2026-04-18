import api from "../lib/api";
import affiliateApi from "../lib/affiliateApi";
import type { Page } from "./affiliateService";

export type AffiliateDecodeSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PlanModule = "MESA" | "DELIVERY" | "COMPLETA";

export type AffiliateDecodeSubmissionRequest = {
  establishmentName: string;
  city: string;
  state?: string;
  cnpj?: string;

  contactName: string;
  contactEmail?: string;
  contactPhone: string;

  estimatedUsersCount?: number;
  estimatedMonthlyRevenue?: number;

  planModule: PlanModule;
  planName: string;
  planPrice: number;
  planDiscountPct?: number;
  planDurationDays: number;
  planFeatures?: string;

  notes?: string;
};

export type AffiliateDecodeSubmission = {
  id: string;
  affiliateId: string | null;
  affiliateName: string | null;
  affiliateRefCode: string | null;

  establishmentName: string;
  city: string;
  state: string | null;
  cnpj: string | null;

  contactName: string;
  contactEmail: string | null;
  contactPhone: string;

  estimatedUsersCount: number | null;
  estimatedMonthlyRevenue: number | null;

  planModule: PlanModule;
  planName: string;
  planPrice: number;
  planDiscountPct: number;
  planDurationDays: number;
  planFeatures: string | null;

  notes: string | null;

  status: AffiliateDecodeSubmissionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;

  decodeId: string | null;
  decodeCode: string | null;
  subscriptionId: string | null;

  createdAt: string;
};

// =================================================================
// Portal do afiliado
// =================================================================
export async function submitMyEstablishment(
  req: AffiliateDecodeSubmissionRequest
): Promise<AffiliateDecodeSubmission> {
  const res = await affiliateApi.post<AffiliateDecodeSubmission>(
    "/api/affiliate/decode-submissions",
    req
  );
  return res.data;
}

export async function listMySubmissions(params: {
  page?: number;
  size?: number;
}): Promise<Page<AffiliateDecodeSubmission>> {
  const res = await affiliateApi.get<Page<AffiliateDecodeSubmission>>(
    "/api/affiliate/decode-submissions",
    { params }
  );
  return res.data;
}

// =================================================================
// Admin
// =================================================================
export async function listAllSubmissions(params: {
  q?: string;
  status?: AffiliateDecodeSubmissionStatus;
  page?: number;
  size?: number;
}): Promise<Page<AffiliateDecodeSubmission>> {
  const res = await api.get<Page<AffiliateDecodeSubmission>>(
    "/api/admin/decode-submissions",
    { params }
  );
  return res.data;
}

export async function fetchSubmissionSummary(): Promise<{ pendingCount: number }> {
  const res = await api.get<{ pendingCount: number }>("/api/admin/decode-submissions/summary");
  return res.data;
}

export async function approveSubmission(id: string): Promise<AffiliateDecodeSubmission> {
  const res = await api.post<AffiliateDecodeSubmission>(
    `/api/admin/decode-submissions/${id}/approve`
  );
  return res.data;
}

export async function rejectSubmission(
  id: string,
  reason: string
): Promise<AffiliateDecodeSubmission> {
  const res = await api.post<AffiliateDecodeSubmission>(
    `/api/admin/decode-submissions/${id}/reject`,
    { reason }
  );
  return res.data;
}
