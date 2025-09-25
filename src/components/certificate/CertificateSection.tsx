import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award,
  Download,
  QrCode,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  FileText,
  Printer,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Certificate {
  id: string;
  certificateNumber: string;
  status: 'pending' | 'ready' | 'expired' | 'revoked';
  issuedDate?: string;
  expiryDate?: string;
  farmName: string;
  applicantName: string;
  cropTypes: string[];
  pdfUrl?: string;
  qrVerificationUrl?: string;
  verificationCode?: string;
}

interface CertificateSectionProps {
  certificates?: Certificate[];
  onDownloadCertificate?: (certificateId: string) => void;
  onVerifyCertificate?: (certificateNumber: string) => void;
  className?: string;
}

const CertificateSection: React.FC<CertificateSectionProps> = ({
  certificates = [],
  onDownloadCertificate,
  onVerifyCertificate,
  className
}) => {
  const [verificationCode, setVerificationCode] = useState('');

  // Mock certificate data
  const defaultCertificates: Certificate[] = [
    {
      id: '1',
      certificateNumber: 'CERT-000123-2024',
      status: 'ready',
      issuedDate: '2024-01-15',
      expiryDate: '2027-01-15',
      farmName: 'ฟาร์มแปลงใหญ่',
      applicantName: 'นายสมชาย ใจดี',
      cropTypes: ['มะม่วง', 'ลำไย', 'ลิ้นจี่'],
      pdfUrl: '/certificates/CERT-000123-2024.pdf',
      qrVerificationUrl: 'https://verify.gacp.org/CERT-000123-2024',
      verificationCode: 'VER123ABC'
    }
  ];

  const allCertificates = certificates.length > 0 ? certificates : defaultCertificates;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'รอออกใบรับรอง', variant: 'secondary' as const, icon: Clock },
      ready: { label: 'พร้อมใช้งาน', variant: 'default' as const, icon: CheckCircle },
      expired: { label: 'หมดอายุ', variant: 'destructive' as const, icon: AlertTriangle },
      revoked: { label: 'ถูกเพิกถอน', variant: 'destructive' as const, icon: AlertTriangle }
    };

    const config = statusMap[status as keyof typeof statusMap];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDownload = (certificate: Certificate) => {
    if (onDownloadCertificate) {
      onDownloadCertificate(certificate.id);
    } else if (certificate.pdfUrl) {
      // Simulate download
      const link = document.createElement('a');
      link.href = certificate.pdfUrl;
      link.download = `${certificate.certificateNumber}.pdf`;
      link.click();
    }
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share && certificate.qrVerificationUrl) {
      try {
        await navigator.share({
          title: `ใบรับรอง GACP - ${certificate.certificateNumber}`,
          text: `ใบรับรองมาตรฐาน GACP สำหรับ ${certificate.farmName}`,
          url: certificate.qrVerificationUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else if (certificate.qrVerificationUrl) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(certificate.qrVerificationUrl);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            ใบรับรองมาตรฐาน GACP
          </CardTitle>
          <CardDescription>
            ดาวน์โหลดและจัดการใบรับรองของคุณ
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Certificate Verification Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">ตรวจสอบใบรับรอง</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              ใส่หมายเลขใบรับรองหรือสแกน QR Code เพื่อตรวจสอบความถูกต้อง
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="หมายเลขใบรับรอง (เช่น CERT-000123-2024)"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onVerifyCertificate && verificationCode) {
                    onVerifyCertificate(verificationCode);
                  }
                }}
                disabled={!verificationCode.trim()}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                ตรวจสอบ
              </Button>
            </div>
          </div>

          {/* Certificates List */}
          {allCertificates.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">ยังไม่มีใบรับรอง</h3>
              <p className="text-muted-foreground mb-4">
                ใบรับรองจะออกให้หลังจากผ่านการประเมินเรียบร้อยแล้ว
              </p>
              <div className="flex justify-center">
                <Button variant="outline" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  ดูสถานะการสมัคร
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {allCertificates.map((certificate) => {
                const daysUntilExpiry = certificate.expiryDate ? getDaysUntilExpiry(certificate.expiryDate) : null;
                const isNearExpiry = daysUntilExpiry !== null && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
                const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

                return (
                  <div
                    key={certificate.id}
                    className={cn(
                      "p-6 border rounded-lg",
                      certificate.status === 'ready' ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {certificate.certificateNumber}
                          </h3>
                          <p className="text-muted-foreground">
                            {certificate.farmName} - {certificate.applicantName}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(certificate.status)}
                    </div>

                    {/* Certificate Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>วันที่ออก: {certificate.issuedDate ? formatDate(certificate.issuedDate) : 'รอดำเนินการ'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>วันหมดอายุ: {certificate.expiryDate ? formatDate(certificate.expiryDate) : 'รอดำเนินการ'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>พืชที่ขอรับรอง: {certificate.cropTypes.join(', ')}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {certificate.verificationCode && (
                          <div className="flex items-center gap-2 text-sm">
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                            <span>รหัสตรวจสอบ: {certificate.verificationCode}</span>
                          </div>
                        )}
                        {daysUntilExpiry !== null && (
                          <div className={cn(
                            "flex items-center gap-2 text-sm",
                            isExpired ? "text-red-600" : isNearExpiry ? "text-orange-600" : "text-green-600"
                          )}>
                            <Clock className="h-4 w-4" />
                            <span>
                              {isExpired 
                                ? `หมดอายุแล้ว ${Math.abs(daysUntilExpiry)} วัน`
                                : `เหลืออีก ${daysUntilExpiry} วัน`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warning Messages */}
                    {isNearExpiry && (
                      <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-orange-800">
                            ใบรับรองใกล้หมดอายุ
                          </span>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          กรุณาเตรียมยื่นขออนุญาต์ต่ออายุใบรับรอง
                        </p>
                      </div>
                    )}

                    {isExpired && (
                      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">
                            ใบรับรองหมดอายุแล้ว
                          </span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          ใบรับรองนี้ไม่สามารถใช้งานได้ กรุณายื่นขอใบรับรองใหม่
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {certificate.status === 'ready' && certificate.pdfUrl && (
                        <Button
                          onClick={() => handleDownload(certificate)}
                          className="gap-2"
                          size="sm"
                        >
                          <Download className="h-4 w-4" />
                          ดาวน์โหลด PDF
                        </Button>
                      )}
                      
                      {certificate.qrVerificationUrl && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(certificate.qrVerificationUrl, '_blank')}
                          className="gap-2"
                          size="sm"
                        >
                          <QrCode className="h-4 w-4" />
                          QR ตรวจสอบ
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => handleShare(certificate)}
                        className="gap-2"
                        size="sm"
                      >
                        <Share2 className="h-4 w-4" />
                        แชร์
                      </Button>
                      
                      {certificate.status === 'ready' && (
                        <Button
                          variant="outline"
                          onClick={() => window.print()}
                          className="gap-2"
                          size="sm"
                        >
                          <Printer className="h-4 w-4" />
                          พิมพ์
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateSection;