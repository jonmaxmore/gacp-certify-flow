import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Clock, CheckCircle, XCircle, LogOut, Search, Filter, Eye, MessageSquare, ArrowRight, ArrowLeft, User, Upload, ThumbsUp, ThumbsDown, AlertCircle, DollarSign, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RejectionCountBadge } from '@/components/dashboard/RejectionCountBadge';

const ReviewerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewComments, setReviewComments] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    needsFix: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter]);

  const fetchApplications = async () => {
    try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:applicant_id(full_name, organization_name, phone, email),
        payments!payments_application_id_fkey(id, milestone, amount, status)
      `)
      .in('workflow_status', ['SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_CONFIRMED_REVIEW', 'REVISION_REQUESTED', 'REJECTED_PAYMENT_REQUIRED'])
      .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
      
      // Set first application as selected if none selected
      if (data && data.length > 0 && !selectedApplication) {
        setSelectedApplication(data[0]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('workflow_status');

      if (error) throw error;

      const stats = {
        pending: data.filter(app => ['SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_CONFIRMED_REVIEW'].includes(app.workflow_status)).length,
        approved: data.filter(app => app.workflow_status === 'REVIEW_APPROVED').length,
        rejected: data.filter(app => app.workflow_status === 'REJECTED').length,
        needsFix: data.filter(app => ['REVISION_REQUESTED', 'REJECTED_PAYMENT_REQUIRED'].includes(app.workflow_status)).length,
        total: data.length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        switch (statusFilter) {
          case 'pending':
            return ['SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_CONFIRMED_REVIEW'].includes(app.workflow_status);
          case 'approved':
            return app.workflow_status === 'REVIEW_APPROVED';
          case 'rejected':
            return app.workflow_status === 'REJECTED';
          case 'needs_fix':
            return ['REVISION_REQUESTED', 'REJECTED_PAYMENT_REQUIRED'].includes(app.workflow_status);
          default:
            return true;
        }
      });
    }

    setFilteredApplications(filtered);
  };

  const getWorkflowStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: 'ส่งแล้ว', variant: 'secondary' },
      UNDER_REVIEW: { label: 'กำลังตรวจสอบ', variant: 'default' },
      PAYMENT_CONFIRMED_REVIEW: { label: 'ชำระเงินแล้ว', variant: 'default' },
      REVIEW_APPROVED: { label: 'อนุมัติเอกสาร', variant: 'default' },
      REVISION_REQUESTED: { label: 'ต้องแก้ไข', variant: 'destructive' },
      REJECTED_PAYMENT_REQUIRED: { label: 'ต้องชำระเพื่อแก้ไข', variant: 'destructive' },
      REJECTED: { label: 'ปฏิเสธ', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatus = (application) => {
    const reviewPayment = application.payments?.find(p => p.milestone === 1);
    if (!reviewPayment) return { status: 'pending', label: 'รอชำระ', variant: 'destructive' };
    
    switch (reviewPayment.status) {
      case 'COMPLETED':
        return { status: 'paid', label: 'ชำระแล้ว', variant: 'default' };
      case 'PENDING':
        return { status: 'pending', label: 'รอชำระ', variant: 'destructive' };
      default:
        return { status: 'unknown', label: 'ไม่ทราบสถานะ', variant: 'secondary' };
    }
  };

  const handleApproveDocuments = async () => {
    if (!selectedApplication) return;
    
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase.rpc('handle_document_approval', {
        p_application_id: selectedApplication.id,
        p_reviewer_id: user.id,
        p_comments: reviewComments || 'เอกสารผ่านการตรวจสอบ'
      });

      if (error) throw error;

      toast({
        title: "อนุมัติเอกสารสำเร็จ",
        description: "ส่งการแจ้งเตือนให้ผู้สมัครชำระค่าประเมินแล้ว",
      });

      setReviewComments('');
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('Error approving documents:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอนุมัติเอกสารได้",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRejectDocuments = async () => {
    if (!selectedApplication || !reviewComments.trim()) {
      toast({
        title: "กรุณากรอกเหตุผล",
        description: "กรุณาระบุเหตุผลในการปฏิเสธเอกสาร",
        variant: "destructive",
      });
      return;
    }
    
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase.rpc('handle_document_rejection', {
        p_application_id: selectedApplication.id,
        p_reviewer_id: user.id,
        p_comments: reviewComments
      });

      if (error) throw error;

      const result = data as any;
      const isPaymentRequired = result?.payment_required || false;

      toast({
        title: "ปฏิเสธเอกสารสำเร็จ",
        description: isPaymentRequired 
          ? `เอกสารถูกปฏิเสธครั้งที่ ${result?.revision_count || 'N/A'} - ผู้สมัครต้องชำระ 5,000 บาท`
          : `ส่งให้ผู้สมัครแก้ไขครั้งที่ ${result?.revision_count || 'N/A'}`,
      });

      setReviewComments('');
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting documents:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปฏิเสธเอกสารได้",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Reviewer Dashboard</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">3 pending notifications</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รอตรวจสอบ</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">อนุมัติแล้ว</p>
                  <p className="text-3xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ต้องแก้ไข</p>
                  <p className="text-3xl font-bold">{stats.needsFix}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/reviewer/queue')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">ค้นหาใบสมัคร</h3>
                  <p className="text-sm text-muted-foreground">ค้นหาด้วยหมายเลขใบสมัคร</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/reviewer/queue')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Filter className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">กรองตามสถานะ</h3>
                  <p className="text-sm text-muted-foreground">กรองใบสมัครตามสถานะ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/reviewer/queue')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">เทมเพลตข้อความ</h3>
                  <p className="text-sm text-muted-foreground">จัดการข้อความมาตรฐาน</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Queue Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="needs_fix">ต้องแก้ไข</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              แสดง {filteredApplications.length} จาก {applications.length} ใบสมัคร
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Queue */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>คิวตรวจสอบเอกสาร</CardTitle>
                <CardDescription>คลิกที่ใบสมัครเพื่อตรวจสอบเอกสาร</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ไม่มีใบสมัครที่ตรงกับเงื่อนไข
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredApplications.map((app) => {
                      const paymentStatus = getPaymentStatus(app);
                      return (
                        <div
                          key={app.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedApplication?.id === app.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{app.profiles?.full_name}</h4>
                                <p className="text-xs text-muted-foreground">{app.application_number}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              {getWorkflowStatusBadge(app.workflow_status)}
                              <Badge variant={paymentStatus.variant as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                                <CreditCard className="h-3 w-3 mr-1" />
                                {paymentStatus.label}
                              </Badge>
                            </div>
                          </div>
                          
                          {app.revision_count_current > 0 && (
                            <RejectionCountBadge
                              revisionCount={app.revision_count_current}
                              maxFreeRevisions={app.max_free_revisions}
                              workflowStatus={app.workflow_status}
                            />
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            อัพเดท: {new Date(app.updated_at).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Review Panel */}
          <div className="space-y-6">
            {selectedApplication ? (
              <Card>
                <CardHeader>
                  <CardTitle>ตรวจสอบเอกสาร</CardTitle>
                  <CardDescription>{selectedApplication.profiles?.full_name} - {selectedApplication.application_number}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Application Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ผู้สมัคร:</span>
                        <p className="font-medium">{selectedApplication.profiles?.full_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">องค์กร:</span>
                        <p className="font-medium">{selectedApplication.profiles?.organization_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ฟาร์ม:</span>
                        <p className="font-medium">{selectedApplication.farm_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">พื้นที่:</span>
                        <p className="font-medium">
                          {selectedApplication.farm_area_rai}-{selectedApplication.farm_area_ngan}-{selectedApplication.farm_area_wah} ไร่-งาน-วา
                        </p>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">สถานะการชำระเงิน</span>
                        <Badge variant={getPaymentStatus(selectedApplication).variant as "default" | "destructive" | "secondary" | "outline"}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          {getPaymentStatus(selectedApplication).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ค่าตรวจสอบเอกสาร: 5,000 บาท
                      </p>
                    </div>

                    {/* Documents Placeholder */}
                    <div>
                      <h4 className="font-medium mb-3">เอกสารที่อัพโหลด</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((doc) => (
                          <div key={doc} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Comments */}
                    <div>
                      <label className="text-sm font-medium">ข้อเสนอแนะ/เหตุผล</label>
                      <Textarea
                        placeholder="กรอกข้อเสนอแนะหรือเหตุผลในการอนุมัติ/ปฏิเสธ..."
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleApproveDocuments}
                        disabled={submittingReview || getPaymentStatus(selectedApplication).status !== 'paid'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        อนุมัติเอกสาร
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleRejectDocuments}
                        disabled={submittingReview || getPaymentStatus(selectedApplication).status !== 'paid'}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        ปฏิเสธเอกสาร
                      </Button>
                    </div>

                    {getPaymentStatus(selectedApplication).status !== 'paid' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">รอการชำระเงิน</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          ผู้สมัครต้องชำระค่าตรวจสอบเอกสาร 5,000 บาท ก่อนที่จะสามารถตรวจสอบได้
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>เลือกใบสมัครเพื่อเริ่มตรวจสอบเอกสาร</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewerDashboard;