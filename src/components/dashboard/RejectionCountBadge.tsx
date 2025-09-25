import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface RejectionCountBadgeProps {
  revisionCount: number;
  maxFreeRevisions: number;
  workflowStatus: string;
}

export const RejectionCountBadge: React.FC<RejectionCountBadgeProps> = ({
  revisionCount,
  maxFreeRevisions,
  workflowStatus
}) => {
  if (revisionCount === 0) {
    return null;
  }

  const isPaymentRequired = workflowStatus === 'REJECTED_PAYMENT_REQUIRED';
  const remainingFreeRevisions = maxFreeRevisions - revisionCount;

  if (isPaymentRequired) {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          ต้องชำระเงินเพื่อแก้ไข
        </Badge>
        <p className="text-xs text-muted-foreground">
          เอกสารถูกปฏิเสธครั้งที่ {revisionCount} - ต้องชำระ 5,000 บาท
        </p>
      </div>
    );
  }

  if (revisionCount <= maxFreeRevisions) {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          แก้ไขครั้งที่ {revisionCount}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {remainingFreeRevisions > 0 
            ? `แก้ไขฟรีได้อีก ${remainingFreeRevisions} ครั้ง`
            : 'หมดจำนวนครั้งฟรี - ครั้งต่อไปต้องชำระเงิน'
          }
        </p>
      </div>
    );
  }

  return null;
};