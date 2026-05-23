export type Role = 'student' | 'hall_admin' | 'dean' | 'security';

export type ReasonCategory = 'Medical' | 'Family Emergency' | 'Official' | 'Personal' | 'Academic';

export type RequestStatus =
  | 'PENDING_HALL_ADMIN'
  | 'APPROVED_BY_HALL_ADMIN'
  | 'REJECTED_BY_HALL_ADMIN'
  | 'APPROVED_FINAL'
  | 'REJECTED_BY_DEAN'
  | 'CHECKED_OUT'
  | 'CHECKED_IN';

export interface Profile {
  id: string;
  full_name: string;
  crawford_number: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface ExeatRequest {
  id: string;
  student_id: string;
  destination: string;
  reason_description: string;
  reason_category: ReasonCategory;
  parent_name: string;           
  parent_phone: string;          
  parent_relationship: string;   
  supporting_document_path: string | null;
  supporting_document_name: string | null;
  departure_date: string;
  return_date: string;
  total_days: number;
  academic_session: string;
  status: RequestStatus;
  hall_admin_comment: string | null;
  dean_comment: string | null;
  checkout_time: string | null;
  checkin_time: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}


export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  request_id: string | null;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Profile;
  exeat_requests?: ExeatRequest;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
