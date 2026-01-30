import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Crown, Building2, Search, Plus, 
  Check, X, Edit, Trash2, ExternalLink, RefreshCw,
  CreditCard, Calendar, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

interface WhiteLabelSetting {
  id: string;
  user_id: string;
  logo_url: string | null;
  company_name: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export function SuperAdminPanel() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [whiteLabelSettings, setWhiteLabelSettings] = useState<WhiteLabelSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super_admin' | 'white_label_admin'>('white_label_admin');
  const [companyName, setCompanyName] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWhiteLabelSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('white_label_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with user info
      const enrichedSettings = await Promise.all(
        (data || []).map(async (setting) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', setting.user_id)
            .single();
          
          return {
            ...setting,
            user_email: profile?.email,
            user_name: profile?.full_name,
          };
        })
      );

      setWhiteLabelSettings(enrichedSettings);
    } catch (error) {
      console.error('Error fetching white label settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWhiteLabelSettings();
  }, [fetchUsers, fetchWhiteLabelSettings]);

  const handlePromoteUser = async () => {
    if (!selectedUser) return;
    setProcessingAction(true);

    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: selectedRole as 'admin' | 'moderator' | 'user' | 'super_admin' | 'white_label_admin',
        });

      if (roleError) throw roleError;

      // If white label admin, create settings entry
      if (selectedRole === 'white_label_admin') {
        const { error: settingsError } = await supabase
          .from('white_label_settings')
          .insert({
            user_id: selectedUser.id,
            company_name: companyName || null,
            subscription_status: 'trial',
            subscription_start: new Date().toISOString(),
            subscription_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 day trial
          });

        if (settingsError) throw settingsError;
      }

      toast.success(`Successfully promoted ${selectedUser.email} to ${selectedRole.replace('_', ' ')}`);
      setPromoteDialogOpen(false);
      setSelectedUser(null);
      setCompanyName('');
      fetchUsers();
      fetchWhiteLabelSettings();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRevokeRole = async (userId: string, role: string) => {
    if (!confirm(`Are you sure you want to revoke the ${role.replace('_', ' ')} role?`)) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as 'admin' | 'moderator' | 'user' | 'super_admin' | 'white_label_admin');

      if (error) throw error;

      // If revoking white label admin, deactivate settings
      if (role === 'white_label_admin') {
        await supabase
          .from('white_label_settings')
          .update({ is_active: false })
          .eq('user_id', userId);
      }

      toast.success('Role revoked successfully');
      fetchUsers();
      fetchWhiteLabelSettings();
    } catch (error) {
      console.error('Error revoking role:', error);
      toast.error('Failed to revoke role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'white_label_admin': return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white';
      case 'admin': return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'trial': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Trial</Badge>;
      case 'expired': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      case 'cancelled': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Super Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Manage users and white-label partners</p>
          </div>
        </div>
        <Button onClick={() => { fetchUsers(); fetchWhiteLabelSettings(); }} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.roles.includes('super_admin')).length}</p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-violet-500" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.roles.includes('white_label_admin')).length}</p>
                <p className="text-sm text-muted-foreground">White Label Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{whiteLabelSettings.filter(s => s.subscription_status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="white-label" className="gap-2">
            <Building2 className="w-4 h-4" />
            White Label Partners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-medium">{(user.email || 'U').charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline">User</Badge>
                          ) : (
                            user.roles.map(role => (
                              <Badge key={role} className={getRoleBadgeColor(role)}>
                                {role.replace('_', ' ')}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setPromoteDialogOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Role
                          </Button>
                          {user.roles.map(role => (
                            <Button
                              key={role}
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => handleRevokeRole(user.id, role)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="white-label" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whiteLabelSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No white label partners yet
                    </TableCell>
                  </TableRow>
                ) : (
                  whiteLabelSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{setting.user_name || 'No name'}</p>
                          <p className="text-xs text-muted-foreground">{setting.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {setting.logo_url && (
                            <img src={setting.logo_url} alt="" className="w-6 h-6 rounded" />
                          )}
                          <span>{setting.company_name || 'Not set'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(setting.subscription_status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {setting.subscription_end ? (
                          <span className={new Date(setting.subscription_end) < new Date() ? 'text-red-400' : 'text-muted-foreground'}>
                            Expires: {format(new Date(setting.subscription_end), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          <Settings className="w-3 h-3 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promote Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-medium">{(selectedUser.email || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium">{selectedUser.full_name || selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={selectedRole} 
                onValueChange={(value: string) => setSelectedRole(value as 'admin' | 'super_admin' | 'white_label_admin')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="white_label_admin">White Label Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'white_label_admin' && (
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteUser} disabled={processingAction}>
              {processingAction ? 'Processing...' : 'Add Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SuperAdminPanel;
