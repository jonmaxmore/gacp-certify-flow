import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Plus, Eye, Edit, Calendar, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface ApplicationData {
  id: string;
  application_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  farm_name?: string;
  applicant_name?: string;
  farm_address?: string;
  crop_types?: string[];
  submitted_at?: string;
}

const ApplicationsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
        .select('*')
        .eq('applicant_id', user?.id)
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
        app.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: 'แบบร่าง', variant: 'secondary' },
      SUBMITTED: { label: 'ส่งแล้ว', variant: 'default' },
      UNDER_REVIEW: { label: 'กำลังตรวจสอบ', variant: 'default' },
      RETURNED: { label: 'ส่งกลับแก้ไข', variant: 'destructive' },
      DOCS_APPROVED: { label: 'เอกสารผ่าน', variant: 'default' },
      PAYMENT_PENDING: { label: 'รอชำระเงิน', variant: 'secondary' },
      ONLINE_SCHEDULED: { label: 'นัดประเมินออนไลน์', variant: 'default' },
      ONSITE_SCHEDULED: { label: 'นัดประเมินออนไซต์', variant: 'default' },
      CERTIFIED: { label: 'ผ่านการรับรอง', variant: 'default' }
    } as const;

    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const 
    };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProgressPercentage = (status: string) => {
    const progressMap = {
      DRAFT: 10,
      SUBMITTED: 20,
      UNDER_REVIEW: 30,
      RETURNED: 25,
      DOCS_APPROVED: 50,
      PAYMENT_PENDING: 60,
      ONLINE_SCHEDULED: 70,
      ONSITE_SCHEDULED: 80,
      CERTIFIED: 100
    };
    return progressMap[status as keyof typeof progressMap] || 0;
  };

  const uniqueStatuses = [...new Set(applications.map(app => app.status))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/applicant/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">ใบสมัครทั้งหมด</h1>
            <p className="text-muted-foreground">จัดการใบสมัครรับรองมาตรฐาน GACP</p>
          </div>
          <Button onClick={() => navigate('/applicant/application/new')}>
            <Plus className="h-4 w-4 mr-2" />
            สร้างใบสมัครใหม่
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาด้วยหมายเลขใบสมัคร, ชื่อฟาร์ม หรือชื่อผู้สมัคร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 bg-background"
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {getStatusBadge(status).props.children}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {applications.length === 0 ? 'ยังไม่มีใบสมัคร' : 'ไม่พบใบสมัครที่ค้นหา'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {applications.length === 0 
                  ? 'เริ่มต้นการสมัครรับรองมาตรฐาน GACP ใบแรกของคุณ'
                  : 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
                }
              </p>
              {applications.length === 0 && (
                <Button onClick={() => navigate('/applicant/application/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างใบสมัครใหม่
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {application.application_number || 'ยังไม่มีหมายเลข'}
                      </h3>
                      <p className="text-muted-foreground">
                        {application.farm_name || application.applicant_name || 'ไม่ระบุชื่อ'}
                      </p>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>ความคืบหน้า</span>
                      <span>{getProgressPercentage(application.status)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${getProgressPercentage(application.status)}%` }}
                      />
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>สร้างเมื่อ: {new Date(application.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    {application.submitted_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>ส่งเมื่อ: {new Date(application.submitted_at).toLocaleDateString('th-TH')}</span>
                      </div>
                    )}
                  </div>

                  {application.farm_address && (
                    <p className="text-sm text-muted-foreground mb-4">
                      ที่อยู่: {application.farm_address}
                    </p>
                  )}

                  {application.crop_types && application.crop_types.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {application.crop_types.map((crop, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/applicant/application/${application.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      ดูรายละเอียด
                    </Button>
                    
                    {['DRAFT', 'RETURNED'].includes(application.status) && (
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/applicant/application/${application.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        แก้ไข
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ApplicationsListPage;