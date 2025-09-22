import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { certificateNumberSchema, validateInput } from '@/utils/inputValidation';

interface CertificateVerificationResult {
  valid: boolean;
  status: 'valid' | 'expired' | 'revoked' | 'not_found';
  certificate_number?: string;
  expires_at?: string;
  message?: string;
}

export const CertificateVerifier = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<CertificateVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerification = async () => {
    if (!certificateNumber.trim()) {
      toast({
        title: "กรุณาใส่หมายเลขใบรับรอง",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate and sanitize input
      const inputValidation = validateInput(certificateNumber.trim());
      if (!inputValidation.isValid) {
        toast({
          title: "ข้อมูลไม่ถูกต้อง",
          description: inputValidation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Validate certificate number format
      try {
        certificateNumberSchema.parse(inputValidation.sanitized);
      } catch (error: any) {
        toast({
          title: "รูปแบบหมายเลขใบรับรองไม่ถูกต้อง",
          description: "กรุณาใส่หมายเลขในรูปแบบ CERT-XXXXXX-YYYY",
          variant: "destructive",
        });
        return;
      }

      // Call the secure verification function
      const { data, error } = await supabase.rpc('verify_certificate', {
        cert_number: inputValidation.sanitized
      });

      if (error) {
        console.error('Certificate verification error:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถตรวจสอบใบรับรองได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
        return;
      }

      setVerificationResult(data as unknown as CertificateVerificationResult);
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบใบรับรองได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'revoked':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'not_found':
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'ใบรับรองถูกต้องและมีผลบังคับใช้';
      case 'expired':
        return 'ใบรับรองหมดอายุแล้ว';
      case 'revoked':
        return 'ใบรับรองถูกยกเลิกแล้ว';
      case 'not_found':
        return 'ไม่พบหมายเลขใบรับรองนี้';
      default:
        return 'สถานะไม่ทราบ';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'valid':
        return 'default';
      case 'expired':
        return 'secondary';
      case 'revoked':
      case 'not_found':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ตรวจสอบใบรับรอง GACP</CardTitle>
        <CardDescription>
          กรุณาใส่หมายเลขใบรับรองเพื่อตรวจสอบสถานะ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="เช่น CERT-123456-2024"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleVerification()}
          />
          <Button onClick={handleVerification} disabled={loading}>
            {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ'}
          </Button>
        </div>

        {verificationResult && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                {getStatusIcon(verificationResult.status)}
                <div>
                  <p className="font-medium">หมายเลขใบรับรอง: {verificationResult.certificate_number}</p>
                  <Badge variant={getStatusVariant(verificationResult.status)}>
                    {getStatusText(verificationResult.status)}
                  </Badge>
                </div>
              </div>
              
              {verificationResult.expires_at && (
                <p className="text-sm text-muted-foreground">
                  วันหมดอายุ: {new Date(verificationResult.expires_at).toLocaleDateString('th-TH')}
                </p>
              )}
              
              {verificationResult.message && (
                <p className="text-sm text-muted-foreground mt-2">
                  {verificationResult.message}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          <p>ระบบนี้แสดงเฉพาะสถานะการตรวจสอบใบรับรองเท่านั้น</p>
          <p>ไม่แสดงข้อมูลทางธุรกิจหรือข้อมูลส่วนบุคคล</p>
        </div>
      </CardContent>
    </Card>
  );
};