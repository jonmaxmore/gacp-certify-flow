import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, FileText, Award, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssessmentResultCardProps {
  assessment: {
    id: string;
    score?: number;
    passed?: boolean;
    status: string;
    completed_at?: string;
    applications: {
      application_number?: string;
      applicant_name?: string;
      farm_name?: string;
      workflow_status?: string;
    };
  };
}

export const AssessmentResultCard: React.FC<AssessmentResultCardProps> = ({ assessment }) => {
  const navigate = useNavigate();

  const getStatusIcon = () => {
    if (assessment.status === 'COMPLETED') {
      return assessment.passed ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      );
    }
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusBadge = () => {
    if (assessment.status === 'COMPLETED') {
      return (
        <Badge variant={assessment.passed ? "default" : "destructive"}>
          {assessment.passed ? 'ผ่าน' : 'ไม่ผ่าน'} - {assessment.score}%
        </Badge>
      );
    }
    return <Badge variant="secondary">กำลังดำเนินการ</Badge>;
  };

  const getCertificateStatus = () => {
    if (assessment.passed && assessment.applications.workflow_status === 'CERTIFIED') {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <Award className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-green-800">ใบรับรอง GACP ออกแล้ว</div>
            <div className="text-sm text-green-600">ระบบได้ออกใบรับรองให้ผู้สมัครแล้ว</div>
          </div>
        </div>
      );
    } else if (assessment.passed && assessment.applications.workflow_status !== 'CERTIFIED') {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600" />
          <div>
            <div className="font-medium text-blue-800">กำลังออกใบรับรอง</div>
            <div className="text-sm text-blue-600">ระบบกำลังดำเนินการออกใบรับรอง GACP</div>
          </div>
        </div>
      );
    } else if (!assessment.passed) {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <div className="font-medium text-red-800">การประเมินไม่ผ่าน</div>
            <div className="text-sm text-red-600">ผู้สมัครต้องทำการแก้ไขและประเมินใหม่</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">
                {assessment.applications.application_number || 'ไม่ระบุหมายเลข'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {assessment.applications.applicant_name} - {assessment.applications.farm_name}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessment.completed_at && (
            <div className="text-sm text-muted-foreground">
              เสร็จสิ้นเมื่อ: {new Date(assessment.completed_at).toLocaleString('th-TH')}
            </div>
          )}

          {getCertificateStatus()}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/auditor/assessment/${assessment.id}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              ดูรายละเอียด
            </Button>
            
            {assessment.status === 'COMPLETED' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/auditor/report/${assessment.id}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                รายงานผล
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};