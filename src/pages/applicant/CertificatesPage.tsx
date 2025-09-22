import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Eye, ArrowLeft, Calendar, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
  applications?: {
    application_number: string;
  };
}

const CertificatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          applications!inner(
            application_number,
            applicant_id
          )
        `)
        .eq('applications.applicant_id', user?.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (certificate: CertificateData) => {
    const now = new Date();
    const expiresAt = new Date(certificate.expires_at);
    const monthsToExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (!certificate.is_active) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
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

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const monthsToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsToExpiry <= 3 && monthsToExpiry > 0;
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
          <Button variant="ghost" onClick={() => navigate('/applicant/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">ใบรับรองของฉัน</h1>
            <p className="text-muted-foreground">ใบรับรองมาตรฐาน GACP ที่ได้รับทั้งหมด</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {certificates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ยังไม่มีใบรับรอง</h3>
              <p className="text-muted-foreground mb-4">
                เมื่อใบสมัครของคุณผ่านการประเมินแล้ว ระบบจะออกใบรับรองให้อัตโนมัติ
              </p>
              <Button onClick={() => navigate('/applicant/application/new')}>
                สร้างใบสมัครใหม่
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ใบรับรองทั้งหมด</p>
                      <p className="text-2xl font-bold">{certificates.length}</p>
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
                      <p className="text-2xl font-bold text-green-600">
                        {certificates.filter(cert => 
                          cert.is_active && new Date(cert.expires_at) > new Date()
                        ).length}
                      </p>
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
                      <p className="text-2xl font-bold text-orange-600">
                        {certificates.filter(cert => 
                          cert.is_active && isExpiringSoon(cert.expires_at)
                        ).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certificates List */}
            <div className="grid grid-cols-1 gap-6">
              {certificates.map((certificate) => (
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

                        {certificate.verification_url && (
                          <Button variant="ghost" size="sm" className="w-full text-xs">
                            <FileText className="h-3 w-3 mr-2" />
                            ตรวจสอบความถูกต้อง
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CertificatesPage;