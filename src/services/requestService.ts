import { api, BASE, getToken } from '../lib/api';
import { ExeatRequest, RequestStatus, AuditLog } from '../types';

// ── Student ────────────────────────────────────────────────────────────────

export async function createRequest(
  _studentId: string,
  data: {
    destination: string;
    reason_description: string;
    reason_category: string;
    departure_date: string;
    return_date: string;
    parent_name: string;
    parent_phone: string;
    parent_relationship: string;
    file?: File;
  }
): Promise<ExeatRequest> {
  const form = new FormData();
  form.append('destination', data.destination);
  form.append('reason_description', data.reason_description);
  form.append('reason_category', data.reason_category);
  form.append('departure_date', data.departure_date);
  form.append('return_date', data.return_date);
  form.append('parent_name', data.parent_name);
  form.append('parent_phone', data.parent_phone);
  form.append('parent_relationship', data.parent_relationship);
  if (data.file) form.append('document', data.file);
  return api.postForm<ExeatRequest>('/requests', form);
}

export async function updateRequest(
  requestId: string,
  _studentId: string,
  data: {
    destination: string;
    reason_description: string;
    reason_category: string;
    departure_date: string;
    return_date: string;
    file?: File;
  }
): Promise<ExeatRequest> {
  const form = new FormData();
  form.append('destination', data.destination);
  form.append('reason_description', data.reason_description);
  form.append('reason_category', data.reason_category);
  form.append('departure_date', data.departure_date);
  form.append('return_date', data.return_date);
  if (data.file) form.append('document', data.file);
  return api.putForm<ExeatRequest>(`/requests/${requestId}`, form);
}

export async function cancelRequest(requestId: string, _studentId: string): Promise<void> {
  await api.delete(`/requests/${requestId}`);
}

export async function getStudentRequests(_studentId: string): Promise<ExeatRequest[]> {
  return api.get<ExeatRequest[]>('/requests/my');
}

export async function getStudentStats(_studentId: string) {
  return api.get<{
    total: number; pending: number; approved: number;
    rejected: number; remaining: number; session: string;
  }>('/requests/my/stats');
}

// ── Shared ─────────────────────────────────────────────────────────────────

export async function getRequestById(requestId: string): Promise<ExeatRequest | null> {
  return api.get<ExeatRequest>(`/requests/${requestId}`);
}

export async function getAllRequests(filters?: {
  status?: RequestStatus;
  search?: string;
  todayOnly?: boolean;       // ✅ new
}): Promise<ExeatRequest[]> {
  const params = new URLSearchParams();
  if (filters?.status)    params.append('status', filters.status);
  if (filters?.search)    params.append('search', filters.search);
  if (filters?.todayOnly) params.append('todayOnly', 'true');  // ✅ new
  const qs = params.toString() ? `?${params}` : '';
  return api.get<ExeatRequest[]>(`/requests/all${qs}`);
}

export async function getAdminStats() {
  return api.get<{
    total: number; todayTotal: number; pendingHallAdmin: number; pendingDean: number;
    approvedFinal: number; checkedOut: number; checkedIn: number; rejected: number;
  }>('/requests/admin/stats');
}

// ── Hall Admin ─────────────────────────────────────────────────────────────

export async function hallApprove(requestId: string, _adminId: string, comment: string): Promise<void> {
  await api.post(`/requests/${requestId}/hall-approve`, { comment });
}

export async function hallReject(requestId: string, _adminId: string, comment: string): Promise<void> {
  await api.post(`/requests/${requestId}/hall-reject`, { comment });
}

// ── Dean ───────────────────────────────────────────────────────────────────

export async function deanApprove(requestId: string, _deanId: string, comment: string): Promise<void> {
  await api.post(`/requests/${requestId}/dean-approve`, { comment });
}

export async function deanReject(requestId: string, _deanId: string, comment: string): Promise<void> {
  await api.post(`/requests/${requestId}/dean-reject`, { comment });
}

// ── Security ───────────────────────────────────────────────────────────────

export async function checkOut(requestId: string, _securityId: string): Promise<void> {
  await api.post(`/requests/${requestId}/checkout`, {});
}

export async function checkIn(requestId: string, _securityId: string): Promise<void> {
  await api.post(`/requests/${requestId}/checkin`, {});
}

// ── Document URL ───────────────────────────────────────────────────────────

export async function getDocumentUrl(path: string): Promise<string> {
  const token = getToken();
  return `${BASE.replace('/api', '')}/uploads/${path}${token ? `?token=${token}` : ''}`;
}

// ── Audit ──────────────────────────────────────────────────────────────────

export async function getAuditLogs(): Promise<AuditLog[]> {
  return api.get<AuditLog[]>('/audit');
}