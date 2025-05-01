export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  role: 'Analyst' | 'Manager' | 'Admin';
  org_id: string;
}

export interface UserLogin {
  username: string; // Email is used as username
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  headquarters?: string;
  team_size?: number;
  website?: string;
  preferred_property_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
