import React from 'react';
import { Badge } from './badge';
import { CheckCircle, Clock, AlertTriangle, XCircle, FileText } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'paid':
      case 'certified':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          label: 'เสร็จสิ้น'
        };
      case 'pending':
      case 'in_progress':
      case 'processing':
        return {
          variant: 'warning' as const,
          icon: Clock,
          label: 'กำลังดำเนินการ'
        };
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'ไม่สำเร็จ'
        };
      case 'draft':
      case 'inactive':
        return {
          variant: 'secondary' as const,
          icon: FileText,
          label: 'ร่าง'
        };
      case 'attention':
      case 'urgent':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          label: 'ต้องดำเนินการ'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: null,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;