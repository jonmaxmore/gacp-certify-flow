import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CertificateVerificationResult {
  valid: boolean;
  status: 'valid' | 'expired' | 'revoked' | 'not_found';
  certificate_number?: string;
  expires_at?: string;
  message?: string;
}

export const CertificateVerification = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateNumber.trim()) {
      toast({
        title: "กรุณาป้อนหมายเลขใบรับรอง",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Use the secure verification function that doesn't expose sensitive data
      const { data, error } = await supabase.rpc('verify_certificate', {
        cert_number: certificateNumber.trim()
      });

      if (error) {
        throw error;
      }

      setResult(data as unknown as CertificateVerificationResult);
    } catch (error: any) {
      console.error('Certificate verification error:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการตรวจสอบ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'revoked':
      case 'not_found':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'ใบรับรองถูกต้องและยังไม่หมดอายุ';
      case 'expired':
        return 'ใบรับรองหมดอายุแล้ว';
      case 'revoked':
        return 'ใบรับรองถูกยกเลิกแล้ว';
      case 'not_found':
        return 'ไม่พบใบรับรองในระบบ';
      default:
        return 'สถานะไม่ทราบ';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'valid':
        return 'default' as const;
      case 'expired':
        return 'secondary' as const;
      case 'revoked':
      case 'not_found':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">ตรวจสอบใบรับรอง GACP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificateNumber">หมายเลขใบรับรอง</Label>
            <Input
              id="certificateNumber"
              type="text"
              placeholder="เช่น CERT-000001-2025"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !certificateNumber.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังตรวจสอบ...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                ตรวจสอบใบรับรอง
              </div>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              <span className="font-medium">ผลการตรวจสอบ</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">สถานะ:</span>
                <Badge variant={getStatusVariant(result.status)}>
                  {getStatusText(result.status)}
                </Badge>
              </div>
              
              {result.certificate_number && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">หมายเลข:</span>
                  <span className="text-sm font-mono">{result.certificate_number}</span>
                </div>
              )}
              
              {result.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">วันหมดอายุ:</span>
                  <span className="text-sm">
                    {new Date(result.expires_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              )}
            </div>
            
            {result.message && (
              <p className="text-sm text-muted-foreground mt-2">
                {result.message}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center mt-4">
          <p>ระบบตรวจสอบความถูกต้องของใบรับรอง GACP</p>
          <p>เพื่อความปลอดภัย ข้อมูลรายละเอียดจะไม่แสดงแก่บุคคลภายนอก</p>
        </div>
      </CardContent>
    </Card>
  );
};