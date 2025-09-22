import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, CreditCard, FileText, VideoIcon, MapPin, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'active' | 'pending' | 'blocked';
  paymentRequired?: boolean;
  paymentAmount?: number;
}

interface WorkflowStatusTrackerProps {
  currentStatus: string;
  userRole: 'applicant' | 'reviewer' | 'auditor' | 'admin';
  applicationData?: any;
  className?: string;
}

const getWorkflowSteps = (currentStatus: string, userRole: string): WorkflowStep[] => {
  const baseSteps: WorkflowStep[] = [
    {
      id: 'DRAFT',
      title: 'เริ่มต้นใบสมัคร',
      description: 'กรอกข้อมูลใบสมัครและเอกสารประกอบ',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'SUBMITTED',
      title: 'ส่งใบสมัครแล้ว',
      description: 'ใบสมัครได้รับการส่งเรียบร้อยแล้ว',
      icon: CheckCircle,
      status: 'completed'
    },
    {
      id: 'PAYMENT_PENDING_REVIEW',
      title: 'ชำระค่าตรวจเอกสาร',
      description: 'ชำระค่าตรวจเอกสาร 5,000 บาท',
      icon: CreditCard,
      status: 'active',
      paymentRequired: true,
      paymentAmount: 5000
    },
    {
      id: 'UNDER_REVIEW',
      title: 'ตรวจสอบเอกสาร',
      description: 'ผู้ทบทวนกำลังตรวจสอบเอกสาร',
      icon: FileText,
      status: 'pending'
    },
    {
      id: 'REVIEW_APPROVED',
      title: 'เอกสารผ่านการตรวจสอบ',
      description: 'เอกสารได้รับการอนุมัติแล้ว',
      icon: CheckCircle,
      status: 'pending'
    },
    {
      id: 'PAYMENT_PENDING_ASSESSMENT',
      title: 'ชำระค่าประเมิน',
      description: 'ชำระค่าประเมิน 25,000 บาท',
      icon: CreditCard,
      status: 'pending',
      paymentRequired: true,
      paymentAmount: 25000
    },
    {
      id: 'ONLINE_ASSESSMENT_SCHEDULED',
      title: 'ประเมินออนไลน์',
      description: 'เข้าร่วมการประเมินออนไลน์',
      icon: VideoIcon,
      status: 'pending'
    },
    {
      id: 'ONSITE_ASSESSMENT_SCHEDULED',
      title: 'ประเมินในพื้นที่',
      description: 'การประเมินในพื้นที่ฟาร์ม',
      icon: MapPin,
      status: 'pending'
    },
    {
      id: 'CERTIFIED',
      title: 'ได้รับใบรับรอง',
      description: 'ได้รับใบรับรอง GACP แล้ว',
      icon: Award,
      status: 'pending'
    }
  ];

  // Update status based on current workflow status
  const statusIndex = baseSteps.findIndex(step => step.id === currentStatus);
  
  return baseSteps.map((step, index) => {
    if (index < statusIndex) {
      return { ...step, status: 'completed' as const };
    } else if (index === statusIndex) {
      return { ...step, status: 'active' as const };
    } else {
      return { ...step, status: 'pending' as const };
    }
  });
};

const getStatusIcon = (status: WorkflowStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'active':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'blocked':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />;
  }
};

const getStatusBadge = (status: WorkflowStep['status']) => {
  const variants = {
    completed: 'default',
    active: 'secondary',
    pending: 'outline',
    blocked: 'destructive'
  } as const;

  const labels = {
    completed: 'เสร็จสิ้น',
    active: 'กำลังดำเนินการ',
    pending: 'รอดำเนินการ',
    blocked: 'หยุดชะงัก'
  } as const;

  return (
    <Badge variant={variants[status]} className="text-xs">
      {labels[status]}
    </Badge>
  );
};

export const WorkflowStatusTracker: React.FC<WorkflowStatusTrackerProps> = ({
  currentStatus,
  userRole,
  applicationData,
  className
}) => {
  const steps = getWorkflowSteps(currentStatus, userRole);
  const currentStepIndex = steps.findIndex(step => step.status === 'active');

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">สถานะการดำเนินการ</h3>
          <div className="text-sm text-muted-foreground">
            ขั้นตอนที่ {currentStepIndex + 1} จาก {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="absolute top-3 left-0 w-full h-0.5 bg-muted" />
          <div 
            className="absolute top-3 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
          
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div 
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 bg-background transition-all duration-300",
                    step.status === 'completed' && "border-green-500 bg-green-500",
                    step.status === 'active' && "border-primary bg-primary",
                    step.status === 'pending' && "border-muted-foreground",
                    step.status === 'blocked' && "border-red-500"
                  )}
                >
                  {step.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                  {step.status === 'active' && (
                    <Clock className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Details */}
        {currentStepIndex >= 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {React.createElement(steps[currentStepIndex].icon, { 
                  className: "h-5 w-5 text-primary" 
                })}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{steps[currentStepIndex].title}</h4>
                  {getStatusBadge(steps[currentStepIndex].status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {steps[currentStepIndex].description}
                </p>
                
                {steps[currentStepIndex].paymentRequired && (
                  <div className="mt-3 p-3 bg-background border border-orange-200 rounded-md">
                    <div className="flex items-center space-x-2 text-orange-700">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        ค่าธรรมเนียม: {steps[currentStepIndex].paymentAmount?.toLocaleString()} บาท
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Steps List - Only show for applicants */}
        {userRole === 'applicant' && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">ขั้นตอนทั้งหมด</h4>
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all",
                  step.status === 'active' && "bg-primary/5 border border-primary/20",
                  step.status === 'completed' && "opacity-75",
                  step.status === 'pending' && "opacity-50"
                )}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      step.status === 'completed' && "line-through"
                    )}>
                      {step.title}
                    </p>
                    {step.paymentRequired && (
                      <Badge variant="outline" className="text-xs">
                        {step.paymentAmount?.toLocaleString()} บาท
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};