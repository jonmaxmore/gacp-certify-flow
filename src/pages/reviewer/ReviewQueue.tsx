import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, Search, Filter, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ReviewQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:applicant_id(full_name, organization_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.farm_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      DRAFT: { label: 'ร่าง', variant: 'outline' },
      SUBMITTED: { label: 'ส่งแล้ว', variant: 'secondary' },
      UNDER_REVIEW: { label: 'กำลังตรวจสอบ', variant: 'default' },
      DOCS_APPROVED: { label: 'อนุมัติเอกสาร', variant: 'success' },
      RETURNED: { label: 'ส่งกลับแก้ไข', variant: 'destructive' },
      PAYMENT_PENDING: { label: 'รอชำระเงิน', variant: 'warning' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
      
      // Refresh the applications list
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/reviewer/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">คิวตรวจสอบ</h1>
            <p className="text-muted-foreground">จัดการและตรวจสอบใบสมัครทั้งหมด</p>
          </div>
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
                placeholder="ค้นหาหมายเลขใบสมัคร, ชื่อ, หรือฟาร์ม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="กรองตามสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="SUBMITTED">ส่งแล้ว</SelectItem>
              <SelectItem value="UNDER_REVIEW">กำลังตรวจสอบ</SelectItem>
              <SelectItem value="DOCS_APPROVED">อนุมัติเอกสาร</SelectItem>
              <SelectItem value="RETURNED">ส่งกลับแก้ไข</SelectItem>
              <SelectItem value="PAYMENT_PENDING">รอชำระเงิน</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              รายการใบสมัคร ({filteredApplications.length})
            </CardTitle>
            <CardDescription>
              คลิกที่ใบสมัครเพื่อดูรายละเอียดและดำเนินการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {applications.length === 0 ? 'ไม่มีใบสมัคร' : 'ไม่พบใบสมัครที่ตรงกับเงื่อนไขการค้นหา'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{app.application_number}</h4>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>ผู้สมัคร: {app.profiles?.full_name}</div>
                          <div>องค์กร: {app.profiles?.organization_name || app.farm_name}</div>
                          <div>วันที่สมัคร: {new Date(app.created_at).toLocaleDateString('th-TH')}</div>
                          <div>อัพเดทล่าสุด: {new Date(app.updated_at).toLocaleDateString('th-TH')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/reviewer/review/${app.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          ตรวจสอบ
                        </Button>
                        {app.status === 'SUBMITTED' && (
                          <Button 
                            size="sm"
                            onClick={() => updateApplicationStatus(app.id, 'UNDER_REVIEW')}
                          >
                            รับเรื่อง
                          </Button>
                        )}
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

export default ReviewQueue;