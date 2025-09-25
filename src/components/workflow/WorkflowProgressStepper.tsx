import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Check, 
  Clock, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  VideoIcon,
  MapPin,
  Award,
  UserCheck,
  Brain,
  Upload,
  Calendar,
  Download
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  icon: React.ComponentType<{ className?: string }>;
}

interface WorkflowProgressStepperProps {
  currentStatus: string;
  revisionCount?: number;
  maxFreeRevisions?: number;
  knowledgeTestPassed?: boolean;
  applicationCreated?: boolean;
}

export const WorkflowProgressStepper: React.FC<WorkflowProgressStepperProps> = ({
  currentStatus,
  revisionCount = 0,
  maxFreeRevisions = 2,
  knowledgeTestPassed = false,
  applicationCreated = false
}) => {
  const getSteps = (): WorkflowStep[] => [
    {
      id: 'register',
      title: 'ลงทะเบียน',
      description: 'สมัครสมาชิกและยืนยันตัวตน',
      status: 'completed', // Always completed if user is logged in
      icon: UserCheck
    },
    {
      id: 'knowledge-test',
      title: 'ทดสอบความรู้',
      description: 'แบบทดสอบ GACP',
      status: knowledgeTestPassed ? 'completed' : (currentStatus === 'DRAFT' && !applicationCreated ? 'current' : 'pending'),
      icon: Brain
    },
    {
      id: 'submit-documents',
      title: 'ส่งเอกสาร',
      description: 'อัพโหลดฟอร์มและเอกสาร',
      status: getStepStatus(['DRAFT', 'SUBMITTED']),
      icon: Upload
    },
    {
      id: 'payment-review',
      title: 'ชำระค่าตรวจเอกสาร',
      description: '5,000 บาท',
      status: getStepStatus(['PAYMENT_PENDING_REVIEW', 'PAYMENT_CONFIRMED_REVIEW']),
      icon: CreditCard
    },
    {
      id: 'review',
      title: 'ตรวจเอกสาร',
      description: revisionCount > 0 
        ? `แก้ไขครั้งที่ ${revisionCount}${revisionCount > maxFreeRevisions ? ' (ต้องชำระเงิน)' : ''}`
        : 'ผู้ทบทวนตรวจสอบ',
      status: getStepStatus([
        'UNDER_REVIEW', 
        'REVISION_REQUESTED', 
        'REJECTED_PAYMENT_REQUIRED',
        'REVIEW_APPROVED'
      ]),
      icon: revisionCount > maxFreeRevisions ? AlertTriangle : Clock
    },
    {
      id: 'payment-assessment',
      title: 'ชำระค่าประเมิน',
      description: '25,000 บาท',
      status: getStepStatus(['PAYMENT_PENDING_ASSESSMENT', 'PAYMENT_CONFIRMED_ASSESSMENT']),
      icon: CreditCard
    },
    {
      id: 'assessment-scheduling',
      title: 'นัดหมายประเมิน',
      description: 'กำหนดวันเวลาประเมิน',
      status: getStepStatus([
        'ONLINE_ASSESSMENT_SCHEDULED',
        'ONSITE_ASSESSMENT_SCHEDULED'
      ]),
      icon: Calendar
    },
    {
      id: 'assessment',
      title: 'ประเมิน',
      description: 'ออนไลน์และในพื้นที่',
      status: getStepStatus([
        'ONLINE_ASSESSMENT_IN_PROGRESS',
        'ONLINE_ASSESSMENT_COMPLETED',
        'ONSITE_ASSESSMENT_IN_PROGRESS',
        'ONSITE_ASSESSMENT_COMPLETED'
      ]),
      icon: VideoIcon
    },
    {
      id: 'certificate',
      title: 'ใบรับรอง',
      description: 'ดาวน์โหลดใบรับรอง GACP',
      status: getStepStatus(['CERTIFIED']),
      icon: Award
    }
  ];

  function getStepStatus(stepStatuses: string[]): 'completed' | 'current' | 'pending' | 'rejected' {
    // Special handling for rejection scenarios
    if (currentStatus === 'REJECTED_PAYMENT_REQUIRED') {
      if (stepStatuses.includes('UNDER_REVIEW') || 
          stepStatuses.includes('REVISION_REQUESTED') || 
          stepStatuses.includes('REJECTED_PAYMENT_REQUIRED')) {
        return 'rejected';
      }
    }

    if (stepStatuses.includes(currentStatus)) {
      return 'current';
    }

    // Check if this step should be completed
    const statusOrder = [
      'DRAFT', 'SUBMITTED',
      'PAYMENT_PENDING_REVIEW', 'PAYMENT_CONFIRMED_REVIEW',
      'UNDER_REVIEW', 'REVISION_REQUESTED', 'REJECTED_PAYMENT_REQUIRED', 'REVIEW_APPROVED',
      'PAYMENT_PENDING_ASSESSMENT', 'PAYMENT_CONFIRMED_ASSESSMENT',
      'ONLINE_ASSESSMENT_SCHEDULED', 'ONSITE_ASSESSMENT_SCHEDULED',
      'ONLINE_ASSESSMENT_IN_PROGRESS', 'ONSITE_ASSESSMENT_IN_PROGRESS',
      'ONLINE_ASSESSMENT_COMPLETED', 'ONSITE_ASSESSMENT_COMPLETED',
      'CERTIFIED'
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepMaxIndex = Math.max(...stepStatuses.map(s => statusOrder.indexOf(s)));

    if (currentIndex > stepMaxIndex) {
      return 'completed';
    }

    return 'pending';
  }

  const steps = getSteps();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    {
                      'bg-green-500 border-green-500 text-white': step.status === 'completed',
                      'bg-blue-500 border-blue-500 text-white': step.status === 'current',
                      'bg-red-500 border-red-500 text-white': step.status === 'rejected',
                      'bg-gray-100 border-gray-300 text-gray-400': step.status === 'pending'
                    }
                  )}
                >
                  {step.status === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : step.status === 'rejected' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center max-w-20">
                  <p className={cn(
                    "text-xs font-medium",
                    {
                      'text-green-600': step.status === 'completed',
                      'text-blue-600': step.status === 'current',
                      'text-red-600': step.status === 'rejected',
                      'text-gray-500': step.status === 'pending'
                    }
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    {
                      'bg-green-500': step.status === 'completed',
                      'bg-gray-300': step.status !== 'completed'
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};