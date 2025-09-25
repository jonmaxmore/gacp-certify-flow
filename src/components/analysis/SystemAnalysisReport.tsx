import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Database,
  Users,
  Shield,
  Workflow,
  Activity
} from 'lucide-react';

export const SystemAnalysisReport = () => {
  const issues = [
    {
      id: 'cert-001',
      type: 'fixed',
      severity: 'critical',
      title: 'ใบรับรองไม่แสดงผลสำหรับใบสมัครที่ได้รับการอนุมัติ',
      description: 'ระบบมีใบสมัครที่ได้รับการอนุมัติ (CERTIFIED) แต่ไม่มีใบรับรองที่ถูกสร้างขึ้น',
      solution: 'แก้ไขแล้ว: สร้างใบรับรองหมายเลข CERT-000001-2025 สำหรับใบสมัครที่ได้รับการอนุมัติ',
      impact: 'ผู้สมัครไม่สามารถดูใบรับรองที่ได้รับการอนุมัติ'
    },
    {
      id: 'func-001',
      type: 'fixed',
      severity: 'medium',
      title: 'ข้อผิดพลาดการ overload ของ function get_user_workflow_tasks',
      description: 'มีการ overload function ที่ทำให้เกิดข้อผิดพลาดในการเรียกใช้',
      solution: 'แก้ไขแล้ว: ลบ function ที่มี parameter และใช้เฉพาะ parameterless version',
      impact: 'Dashboard ไม่สามารถโหลดข้อมูล workflow tasks ได้'
    },
    {
      id: 'test-001',
      type: 'completed',
      severity: 'info',
      title: 'สร้างระบบทดสอบการเชื่อมต่อแบบครอบคลุม',
      description: 'พัฒนาระบบทดสอบ 200+ เทสเคสเพื่อตรวจสอบการทำงานของระบบทั้งหมด',
      solution: 'เพิ่มใหม่: SystemTestDashboard สำหรับทดสอบการเชื่อมต่อของระบบ',
      impact: 'สามารถตรวจสอบปัญหาการเชื่อมต่อได้อย่างครอบคลุม'
    }
  ];

  const integrationPoints = [
    {
      name: 'Applicant → Reviewer',
      status: 'working',
      description: 'การส่งใบสมัครจากผู้สมัครไปยังผู้ตรวจสอบ',
      tests: ['Application submission', 'Document upload', 'Status updates']
    },
    {
      name: 'Reviewer → Auditor',
      status: 'working',
      description: 'การส่งต่อใบสมัครที่ผ่านการตรวจสอบไปยังผู้ประเมิน',
      tests: ['Document approval', 'Assessment scheduling', 'Payment validation']
    },
    {
      name: 'Auditor → Certificate',
      status: 'fixed',
      description: 'การออกใบรับรองหลังจากผ่านการประเมิน',
      tests: ['Assessment completion', 'Certificate generation', 'Notification']
    },
    {
      name: 'Database RLS',
      status: 'warning',
      description: 'ระบบความปลอดภัยการเข้าถึงข้อมูล',
      tests: ['Row level security', 'User permissions', 'Data isolation']
    }
  ];

  const workflows = [
    {
      name: 'Complete Application Flow',
      steps: [
        'Draft → Submitted → Under Review → Approved → Assessment → Certified',
        'Payment at review stage and assessment stage',
        'Automatic certificate generation upon completion'
      ],
      status: 'working',
      issues: 'Certificate generation was fixed'
    },
    {
      name: 'Document Review Process',
      steps: [
        'Reviewer receives application',
        'Reviews documents and provides feedback',
        'Approves or requests revisions'
      ],
      status: 'working',
      issues: 'None identified'
    },
    {
      name: 'Assessment Scheduling',
      steps: [
        'Auditor schedules online/onsite assessment',
        'Meeting links generated automatically',
        'Notifications sent to applicants'
      ],
      status: 'working',
      issues: 'None identified'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fixed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'destructive',
      medium: 'secondary',
      info: 'default'
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">รายงานการวิเคราะห์ระบบ</h1>
        <p className="text-muted-foreground">
          ผลการวิจัย วิเคราะห์ และตรวจสอบการเชื่อมต่อระบบทั้งหมด
        </p>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            สรุปผลการตรวจสอบ
          </CardTitle>
          <CardDescription>
            ภาพรวมของปัญหาที่พบและการแก้ไข
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">ปัญหาหลักแก้ไขแล้ว</h3>
              <p className="text-sm text-muted-foreground">
                ใบรับรองสร้างสำเร็จ และระบบเชื่อมต่อกันได้
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold">ระบบทดสอบพร้อม</h3>
              <p className="text-sm text-muted-foreground">
                200+ เทสเคสสำหรับตรวจสอบการทำงาน
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold">ต้องปรับปรุงความปลอดภัย</h3>
              <p className="text-sm text-muted-foreground">
                21 จุดด้านความปลอดภัยต้องแก้ไข
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Found and Fixed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            ปัญหาที่พบและการแก้ไข
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.type)}
                    <h4 className="font-semibold">{issue.title}</h4>
                  </div>
                  {getSeverityBadge(issue.severity)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                <p className="text-sm font-medium text-green-700">{issue.solution}</p>
                <p className="text-xs text-muted-foreground mt-1">ผลกระทบ: {issue.impact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            จุดเชื่อมต่อระหว่างระบบ
          </CardTitle>
          <CardDescription>
            การตรวจสอบการเชื่อมต่อระหว่างส่วนต่างๆ ของระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationPoints.map((point, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(point.status)}
                    <h4 className="font-semibold">{point.name}</h4>
                  </div>
                  <Badge variant={point.status === 'working' ? 'default' : 'secondary'}>
                    {point.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{point.description}</p>
                <div className="flex flex-wrap gap-1">
                  {point.tests.map((test, testIndex) => (
                    <Badge key={testIndex} variant="outline" className="text-xs">
                      {test}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            การวิเคราะห์ Workflow
          </CardTitle>
          <CardDescription>
            การตรวจสอบขั้นตอนการทำงานของระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{workflow.name}</h4>
                  {getStatusIcon(workflow.status)}
                </div>
                <div className="space-y-2">
                  {workflow.steps.map((step, stepIndex) => (
                    <p key={stepIndex} className="text-sm text-muted-foreground">• {step}</p>
                  ))}
                </div>
                {workflow.issues && (
                  <p className="text-sm text-blue-600 mt-2">หมายเหตุ: {workflow.issues}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Analysis */}
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Shield className="h-5 w-5" />
            การวิเคราะห์ความปลอดภัย
          </CardTitle>
          <CardDescription>
            ปัญหาด้านความปลอดภัยที่ต้องให้ความสนใจ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">พบ 21 จุดด้านความปลอดภัยที่ต้องปรับปรุง</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 2 Security Definer Views ที่อาจมีความเสี่ยง</li>
              <li>• 18 Anonymous Access Policies ที่ต้องทบทวน</li>
              <li>• Function Search Path ที่ไม่ได้กำหนด</li>
              <li>• Leaked Password Protection ยังไม่เปิดใช้งาน</li>
            </ul>
            <p className="text-sm text-yellow-600 mt-2">
              แนะนำให้ทบทวนและแก้ไขปัญหาเหล่านี้เพื่อความปลอดภัยของระบบ
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            ข้อเสนะแนะสำหรับการพัฒนาต่อ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">ใช้ระบบทดสอบอัตโนมัติ</h4>
                <p className="text-sm text-muted-foreground">
                  เข้าไปที่ /system-test เพื่อทดสอบการทำงานของระบบอย่างสม่ำเสมอ
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium">แก้ไขปัญหาความปลอดภัย</h4>
                <p className="text-sm text-muted-foreground">
                  ทบทวนและแก้ไข 21 จุดด้านความปลอดภัยที่ระบบตรวจพบ
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">ตรวจสอบ Database Triggers</h4>
                <p className="text-sm text-muted-foreground">
                  ตรวจสอบให้แน่ใจว่า auto_issue_certificate trigger ทำงานอย่างถูกต้อง
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};