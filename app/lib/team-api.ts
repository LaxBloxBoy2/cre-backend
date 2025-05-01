import api from './api';

// Define the team member interface
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  org_role: string;
  created_at: string;
}

// Define the organization interface
export interface Organization {
  id: string;
  name: string;
  members: TeamMember[];
}

/**
 * Get the current user's organization with members
 * @returns Organization with members
 */
export const getOrganizationWithMembers = async (): Promise<Organization> => {
  const response = await api.get('/api/orgs/my/members');
  return response.data;
};

/**
 * Update a team member's role
 * @param userId User ID
 * @param role New role
 * @returns Updated team member
 */
export const updateTeamMemberRole = async (userId: string, role: string): Promise<TeamMember> => {
  const response = await api.put(`/api/orgs/members/${userId}/role`, { role });
  return response.data;
};

/**
 * Invite a new team member
 * @param email Email of the invitee
 * @param role Role to assign
 * @returns Invite object
 */
export const inviteTeamMember = async (email: string, role: string): Promise<any> => {
  const response = await api.post('/api/orgs/invite', { email, role });
  return response.data;
};

/**
 * Remove a team member from the organization
 * @param userId User ID
 * @returns Success status
 */
export const removeTeamMember = async (userId: string): Promise<void> => {
  await api.delete(`/api/orgs/members/${userId}`);
};
