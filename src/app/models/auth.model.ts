export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  guideId?: number | null;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DevTestAccount {
  label: string;
  email: string;
  role: string;
}

export const DEV_TEST_ACCOUNTS: DevTestAccount[] = [
  { label: 'Admin', email: 'admin@tmatour.com', role: 'ADMIN' },
  { label: 'Admin 2', email: 'ops.admin@tmatour.com', role: 'ADMIN' },
  { label: 'Agent', email: 'agent@tmatour.com', role: 'AGENT' },
  { label: 'Agent 2', email: 'agent2@tmatour.com', role: 'AGENT' },
  { label: 'Guide (Sophia)', email: 'sophia.taylor@tmatour.com', role: 'GUIDE' },
  { label: 'Guide (Emily)', email: 'emily.j@tmatour.com', role: 'GUIDE' },
];
