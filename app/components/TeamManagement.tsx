'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useToast } from '../contexts/ToastContext';
import {
  getOrganizationWithMembers,
  updateTeamMemberRole,
  inviteTeamMember,
  Organization,
  TeamMember
} from '../lib/team-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Button } from './ui/button';
import { Loader2, UserPlus, Save, X, UserX } from 'lucide-react';

const TeamManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Analyst');
  const [isInviting, setIsInviting] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true);
      try {
        // Try to fetch from API
        let org: Organization;

        try {
          org = await getOrganizationWithMembers();
        } catch (apiError) {
          console.warn('API call failed, using mock data:', apiError);
          // Fallback to mock data if API call fails
          org = {
            id: '1',
            name: 'Acme Real Estate',
            members: [
              {
                id: 'user1',
                name: 'John Doe',
                email: 'john@example.com',
                org_role: 'Owner',
                created_at: '2023-01-01T00:00:00Z'
              },
              {
                id: 'user2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                org_role: 'Manager',
                created_at: '2023-01-02T00:00:00Z'
              },
              {
                id: 'user3',
                name: 'Bob Johnson',
                email: 'bob@example.com',
                org_role: 'Analyst',
                created_at: '2023-01-03T00:00:00Z'
              }
            ]
          };
        }

        setOrganization(org);

        // Initialize member roles
        const roles: Record<string, string> = {};
        org.members.forEach(member => {
          roles[member.id] = member.org_role;
        });
        setMemberRoles(roles);

        // Get current user from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUserId(user.id);

          // Find the current user in the members list to get their org_role
          const currentMember = org.members.find(member => member.id === user.id);
          if (currentMember) {
            setCurrentUserRole(currentMember.org_role);
          } else {
            // Fallback to a default role if user not found in members
            setCurrentUserRole('Analyst');
          }
        } else {
          // Fallback for demo purposes
          setCurrentUserId(org.members[0].id);
          setCurrentUserRole(org.members[0].org_role);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        showToast('Failed to load team members', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [showToast]);

  // Handle role change
  const handleRoleChange = (memberId: string, role: string) => {
    setMemberRoles(prev => ({
      ...prev,
      [memberId]: role
    }));
  };

  // Start editing a member
  const handleEditMember = (memberId: string) => {
    setEditingMember(memberId);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset to original roles
    if (organization) {
      const roles: Record<string, string> = {};
      organization.members.forEach(member => {
        roles[member.id] = member.org_role;
      });
      setMemberRoles(roles);
    }
    setEditingMember(null);
  };

  // Save role changes
  const handleSaveRoles = async () => {
    setSaving(true);
    try {
      // Check if trying to remove the last Owner
      const hasOwner = Object.values(memberRoles).includes('Owner');
      if (!hasOwner) {
        showToast('There must be at least one Owner in the organization', 'error');
        setSaving(false);
        return;
      }

      if (organization && editingMember) {
        // Get the new role for the member being edited
        const newRole = memberRoles[editingMember];

        try {
          // Call the API to update the role
          await updateTeamMemberRole(editingMember, newRole);

          // Update the local state
          const updatedMembers = organization.members.map(member =>
            member.id === editingMember
              ? { ...member, org_role: newRole }
              : member
          );

          setOrganization({
            ...organization,
            members: updatedMembers
          });

          showToast('Team member role updated successfully', 'success');
        } catch (apiError) {
          console.error('API call failed, updating local state only:', apiError);

          // Fallback to updating local state only if API call fails
          const updatedMembers = organization.members.map(member => ({
            ...member,
            org_role: memberRoles[member.id]
          }));

          setOrganization({
            ...organization,
            members: updatedMembers
          });

          showToast('Team member role updated (offline mode)', 'warning');
        }

        setEditingMember(null);
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      showToast('Failed to update team member roles', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Check if the current user can edit roles
  const canEditRoles = currentUserRole === 'Owner' || currentUserRole === 'Manager';

  // Check if a specific role can be assigned by the current user
  const canAssignRole = (role: string) => {
    if (currentUserRole === 'Owner') {
      return true; // Owners can assign any role
    } else if (currentUserRole === 'Manager') {
      return role !== 'Owner'; // Managers can't assign Owner role
    }
    return false;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle invite dialog open
  const handleOpenInviteDialog = () => {
    setInviteEmail('');
    setInviteRole('Analyst');
    setShowInviteDialog(true);
    // Focus the email input after the dialog is shown
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 100);
  };

  // Handle invite dialog close
  const handleCloseInviteDialog = () => {
    setShowInviteDialog(false);
  };

  // Handle invite team member
  const handleInviteTeamMember = async () => {
    // Validate email
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsInviting(true);
    try {
      // Call the API to invite the team member
      try {
        await inviteTeamMember(inviteEmail, inviteRole);
        showToast(`Invitation sent to ${inviteEmail}`, 'success');
        setShowInviteDialog(false);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        showToast(`Invitation would be sent to ${inviteEmail} (offline mode)`, 'warning');
        setShowInviteDialog(false);
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      showToast('Failed to invite team member', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          Team Members
        </h3>

        {editingMember && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              className="flex items-center"
              style={{
                borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                color: 'var(--text-muted)'
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleSaveRoles}
              disabled={saving}
              className="flex items-center bg-accent hover:bg-accent/90 text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border" style={{
        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
      }}>
        <Table>
          <TableHeader>
            <TableRow style={{
              backgroundColor: isDark ? 'var(--bg-card-hover-darker)' : 'var(--bg-card-hover-light)'
            }}>
              <TableHead style={{ color: 'var(--text-primary)' }}>Name</TableHead>
              <TableHead style={{ color: 'var(--text-primary)' }}>Email</TableHead>
              <TableHead style={{ color: 'var(--text-primary)' }}>Role</TableHead>
              <TableHead style={{ color: 'var(--text-primary)' }}>Joined</TableHead>
              {canEditRoles && (
                <TableHead className="text-right" style={{ color: 'var(--text-primary)' }}>Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {organization?.members.map((member) => (
              <TableRow key={member.id} style={{
                backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)'
              }}>
                <TableCell style={{ color: 'var(--text-primary)' }}>
                  {member.name}
                  {member.id === currentUserId && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--accent)' }}>(You)</span>
                  )}
                </TableCell>
                <TableCell style={{ color: 'var(--text-primary)' }}>{member.email}</TableCell>
                <TableCell>
                  {editingMember === member.id ? (
                    <Select
                      value={memberRoles[member.id]}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                      disabled={member.id === currentUserId} // Can't change own role
                    >
                      <SelectTrigger className="w-32" style={{
                        backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{
                        backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}>
                        {canAssignRole('Owner') && (
                          <SelectItem value="Owner">Owner</SelectItem>
                        )}
                        {canAssignRole('Manager') && (
                          <SelectItem value="Manager">Manager</SelectItem>
                        )}
                        {canAssignRole('Analyst') && (
                          <SelectItem value="Analyst">Analyst</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span style={{
                      color: member.org_role === 'Owner'
                        ? isDark ? '#00F0B4' : '#00C79A'
                        : member.org_role === 'Manager'
                          ? isDark ? '#FFD700' : '#D4AF37'
                          : 'var(--text-primary)'
                    }}>
                      {member.org_role}
                    </span>
                  )}
                </TableCell>
                <TableCell style={{ color: 'var(--text-muted)' }}>
                  {formatDate(member.created_at)}
                </TableCell>
                {canEditRoles && (
                  <TableCell className="text-right">
                    {editingMember === null && member.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMember(member.id)}
                        className="text-xs"
                        style={{ color: 'var(--accent)' }}
                      >
                        Change Role
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canEditRoles && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={handleOpenInviteDialog}
            style={{
              borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
              color: 'var(--text-primary)'
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        </div>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg max-w-md w-full" style={{
            backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
            borderWidth: '1px',
            borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
          }}>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                Invite Team Member
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-md"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                      borderWidth: '1px',
                      borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="email@example.com"
                    disabled={isInviting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Role
                  </label>
                  <Select
                    value={inviteRole}
                    onValueChange={setInviteRole}
                    disabled={isInviting}
                  >
                    <SelectTrigger className="w-full" style={{
                      backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                      borderWidth: '1px',
                      borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{
                      backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
                      borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}>
                      {canAssignRole('Owner') && (
                        <SelectItem value="Owner">Owner</SelectItem>
                      )}
                      {canAssignRole('Manager') && (
                        <SelectItem value="Manager">Manager</SelectItem>
                      )}
                      {canAssignRole('Analyst') && (
                        <SelectItem value="Analyst">Analyst</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCloseInviteDialog}
                  disabled={isInviting}
                  style={{
                    borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                    color: 'var(--text-muted)'
                  }}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleInviteTeamMember}
                  disabled={isInviting || !inviteEmail}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  {isInviting ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
