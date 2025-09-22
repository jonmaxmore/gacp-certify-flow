import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Award, Search, Download, Eye, ArrowLeft, Calendar, CheckCircle, AlertTriangle, XCircle, FileText, Filter, Plus, Trash2, RotateCcw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CertificateData {
  id: string;
  certificate_number: string;
  applicant_name: string;
  organization_name?: string;
  farm_name?: string;
  farm_address?: string;
  crop_types?: string[];
  issued_at: string;
  valid_from: string;
  expires_at: string;
  is_active: boolean;
  verification_url?: string;
  pdf_url?: string;
  revoked_at?: string;
  revoked_reason?: string;
  applications?: {
    application_number: string;
    status: string;
  };
}

const CertificateManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    expiring: 0,
    revoked: 0
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [certificates, searchTerm, statusFilter, dateFilter]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          applications!inner(
            application_number,
            status
          )
        `)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      
      setCertificates(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลใบรับรองได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: CertificateData[]) => {
    const now = new Date();
    const stats = {
      total: data.length,
      active: 0,
      expired: 0,
      expiring: 0,
      revoked: 0
    };

    data.forEach(cert => {
      const expiresAt = new Date(cert.expires_at);
      const monthsToExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (!cert.is_active) {
        stats.revoked++;
      } else if (expiresAt < now) {
        stats.expired++;
      } else if (monthsToExpiry <= 3) {
        stats.expiring++;
      } else {
        stats.active++;
      }
    });

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = certificates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.applications?.application_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(cert => {
        const expiresAt = new Date(cert.expires_at);
        const monthsToExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

        switch (statusFilter) {
          case 'active':
            return cert.is_active && expiresAt > now && monthsToExpiry > 3;
          case 'expiring':
            return cert.is_active && monthsToExpiry <= 3 && monthsToExpiry > 0;
          case 'expired':
            return cert.is_active && expiresAt < now;
          case 'revoked':
            return !cert.is_active;
          default:
            return true;
        }
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(cert => {
        const issuedAt = new Date(cert.issued_at);
        const diffTime = now.getTime() - issuedAt.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'quarter':
            return diffDays <= 90;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }

    setFilteredCertificates(filtered);
  };

  const getStatusBadge = (certificate: CertificateData) => {
    const now = new Date();
    const expiresAt = new Date(certificate.expires_at);
    const monthsToExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (!certificate.is_active) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          ยกเลิกแล้ว
        </Badge>
      );
    }

    if (expiresAt < now) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          หมดอายุ
        </Badge>
      );
    }

    if (monthsToExpiry <= 3) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          ใกล้หมดอายุ
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        ใช้งานได้
      </Badge>
    );
  };

  const handleRevokeCertificate = async () => {
    if (!selectedCertificate || !revokeReason.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาใส่เหตุผลในการยกเลิกใบรับรอง",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('certificates')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: revokeReason.trim(),
          revoked_by: user?.id
        })
        .eq('id', selectedCertificate.id);

      if (error) throw error;

      toast({
        title: "ยกเลิกใบรับรองเรียบร้อย",
        description: `ใบรับรองหมายเลข ${selectedCertificate.certificate_number} ถูกยกเลิกแล้ว`,
      });

      setShowRevokeDialog(false);
      setRevokeReason('');
      setSelectedCertificate(null);
      fetchCertificates();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกใบรับรองได้",
        variant: "destructive",
      });
    }
  };

  const handleRestoreCertificate = async (certificate: CertificateData) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({
          is_active: true,
          revoked_at: null,
          revoked_reason: null,
          revoked_by: null
        })
        .eq('id', certificate.id);

      if (error) throw error;

      toast({
        title: "คืนสถานะใบรับรองเรียบร้อย",
        description: `ใบรับรองหมายเลข ${certificate.certificate_number} ได้รับการคืนสถานะแล้ว`,
      });

      fetchCertificates();
    } catch (error) {
      console.error('Error restoring certificate:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถคืนสถานะใบรับรองได้",
        variant: "destructive",
      });
    }
  };

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
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">จัดการใบรับรอง GACP</h1>
            <p className="text-muted-foreground">จัดการและติดตามใบรับรองมาตรฐาน GACP ทั้งหมด</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ทั้งหมด</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Award className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ใช้งานได้</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ใกล้หมดอายุ</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">หมดอายุ</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ยกเลิก</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.revoked}</p>
                </div>
                <Trash2 className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ตัวกรองและค้นหา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">ค้นหา</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="หมายเลขใบรับรอง, ชื่อ, ฟาร์ม..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">สถานะ</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="active">ใช้งานได้</SelectItem>
                    <SelectItem value="expiring">ใกล้หมดอายุ</SelectItem>
                    <SelectItem value="expired">หมดอายุ</SelectItem>
                    <SelectItem value="revoked">ยกเลิกแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">ช่วงเวลา</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="week">7 วันที่ผ่านมา</SelectItem>
                    <SelectItem value="month">30 วันที่ผ่านมา</SelectItem>
                    <SelectItem value="quarter">3 เดือนที่ผ่านมา</SelectItem>
                    <SelectItem value="year">1 ปีที่ผ่านมา</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="w-full"
                >
                  ล้างตัวกรอง
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificates List */}
        <div className="space-y-4">
          {filteredCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ไม่พบใบรับรอง</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'ไม่พบใบรับรองที่ตรงกับเงื่อนไขที่กำหนด'
                    : 'ยังไม่มีใบรับรองในระบบ'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCertificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{certificate.certificate_number}</CardTitle>
                        <CardDescription>
                          {certificate.applications?.application_number}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(certificate)}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ผู้ได้รับใบรับรอง</label>
                        <p className="font-medium">{certificate.applicant_name}</p>
                        {certificate.organization_name && (
                          <p className="text-sm text-muted-foreground">{certificate.organization_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ฟาร์ม</label>
                        <p className="font-medium">{certificate.farm_name || 'ไม่ระบุ'}</p>
                        {certificate.farm_address && (
                          <p className="text-sm text-muted-foreground">{certificate.farm_address}</p>
                        )}
                      </div>

                      {certificate.crop_types && certificate.crop_types.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">พืชที่ปลูก</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {certificate.crop_types.map((crop, index) => (
                              <Badge key={index} variant="outline">{crop}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">วันที่ออกใบรับรอง</label>
                          <p className="font-medium">
                            {new Date(certificate.issued_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">วันหมดอายุ</label>
                          <p className="font-medium">
                            {new Date(certificate.expires_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>

                      {certificate.revoked_at && (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">วันที่ยกเลิก</label>
                            <p className="font-medium text-red-600">
                              {new Date(certificate.revoked_at).toLocaleDateString('th-TH')}
                            </p>
                            {certificate.revoked_reason && (
                              <p className="text-sm text-muted-foreground">{certificate.revoked_reason}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          ดูใบรับรอง
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          ดาวน์โหลด PDF
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        {certificate.is_active ? (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedCertificate(certificate);
                              setShowRevokeDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ยกเลิกใบรับรอง
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleRestoreCertificate(certificate)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            คืนสถานะ
                          </Button>
                        )}

                        {certificate.verification_url && (
                          <Button variant="ghost" size="sm" className="flex-1 text-xs">
                            <FileText className="h-3 w-3 mr-2" />
                            ตรวจสอบ
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Revoke Certificate Dialog */}
        {showRevokeDialog && selectedCertificate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-red-600">ยกเลิกใบรับรอง</CardTitle>
                <CardDescription>
                  คุณกำลังจะยกเลิกใบรับรองหมายเลข {selectedCertificate.certificate_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reason">เหตุผลในการยกเลิก *</Label>
                  <Textarea
                    id="reason"
                    placeholder="กรุณาระบุเหตุผลในการยกเลิกใบรับรอง..."
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowRevokeDialog(false);
                      setRevokeReason('');
                      setSelectedCertificate(null);
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleRevokeCertificate}
                    disabled={!revokeReason.trim()}
                  >
                    ยืนยันการยกเลิก
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default CertificateManagement;