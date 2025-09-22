import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowLeft, Search, Plus, Edit, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "อัพเดทบทบาทผู้ใช้เรียบร้อยแล้ว",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัพเดทบทบาทได้",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `${!currentStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ผู้ใช้เรียบร้อยแล้ว`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทสถานะผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      applicant: { label: 'ผู้สมัคร', variant: 'secondary' },
      reviewer: { label: 'ผู้ตรวจสอบ', variant: 'default' },
      auditor: { label: 'ผู้ประเมิน', variant: 'success' },
      admin: { label: 'ผู้ดูแลระบบ', variant: 'destructive' }
    };
    const config = roleMap[role] || { label: role, variant: 'secondary' };
    return <Badge variant={config.variant === 'success' ? 'default' : config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge variant={isActive ? 'default' : 'destructive'}>
        {isActive ? 'ใช้งานได้' : 'ปิดใช้งาน'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">จัดการผู้ใช้</h1>
            <p className="text-muted-foreground">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, อีเมล, หรือองค์กร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="กรองตามบทบาท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกบทบาท</SelectItem>
              <SelectItem value="applicant">ผู้สมัคร</SelectItem>
              <SelectItem value="reviewer">ผู้ตรวจสอบ</SelectItem>
              <SelectItem value="auditor">ผู้ประเมิน</SelectItem>
              <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ผู้สมัคร</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'applicant').length}</p>
                </div>
                <Badge variant="secondary" className="h-6 w-6 rounded-full p-1" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">เจ้าหน้าที่</p>
                  <p className="text-2xl font-bold">{users.filter(u => ['reviewer', 'auditor', 'admin'].includes(u.role)).length}</p>
                </div>
                <Shield className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ใช้งานได้</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
                </div>
                <Badge variant="default" className="h-6 w-6 rounded-full p-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              รายการผู้ใช้ ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              จัดการบทบาทและสถานะของผู้ใช้ในระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {users.length === 0 ? 'ไม่มีผู้ใช้' : 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((userData) => (
                  <div key={userData.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{userData.full_name}</h4>
                          {getRoleBadge(userData.role)}
                          {getStatusBadge(userData.is_active)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>อีเมล: {userData.email}</div>
                          <div>โทรศัพท์: {userData.phone || 'ไม่ระบุ'}</div>
                          <div>องค์กร: {userData.organization_name || 'ไม่ระบุ'}</div>
                          <div>สมัครเมื่อ: {new Date(userData.created_at).toLocaleDateString('th-TH')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={userData.role}
                          onValueChange={(newRole) => updateUserRole(userData.id, newRole)}
                          disabled={userData.id === user?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applicant">ผู้สมัคร</SelectItem>
                            <SelectItem value="reviewer">ผู้ตรวจสอบ</SelectItem>
                            <SelectItem value="auditor">ผู้ประเมิน</SelectItem>
                            <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(userData.id, userData.is_active)}
                          disabled={userData.id === user?.id}
                        >
                          {userData.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          แก้ไข
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserManagement;