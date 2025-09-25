import React from 'react';
import { AppleCard } from '@/components/ui/apple-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CreditCard, 
  Calendar, 
  Award, 
  Brain, 
  Plus, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Bell,
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  knowledgeTestScore: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  disabled?: boolean;
}

interface NextStep {
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

interface AppleStyleDashboardProps {
  userName: string;
  stats: DashboardStats;
  quickActions: QuickAction[];
  nextSteps: NextStep[];
  knowledgeTestPassed: boolean;
  onKnowledgeTestClick: () => void;
  className?: string;
}

const ProgressTracker = ({ currentStep = 1, totalSteps = 7 }) => {
  const steps = [
    'ลงทะเบียน',
    'ทดสอบความรู้', 
    'ยื่นใบสมัคร',
    'ชำระค่าตรวจ',
    'ตรวจเอกสาร',
    'ชำระค่าประเมิน',
    'รับใบรับรอง'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">ความคืบหน้า GACP</h3>
        <span className="text-sm text-muted-foreground">{currentStep}/{totalSteps}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span className={cn(
                "text-xs text-center max-w-16",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 transition-all duration-300",
                index < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "primary",
  trend,
  className 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}) => (
  <AppleCard variant="default" animation="fade" className={cn("relative overflow-hidden", className)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}% จากเดือนที่แล้ว
          </p>
        )}
      </div>
      <div className={cn(
        "p-3 rounded-xl",
        color === "primary" && "bg-primary/10",
        color === "success" && "bg-success/10",
        color === "warning" && "bg-warning/10",
        color === "destructive" && "bg-destructive/10"
      )}>
        <Icon className={cn(
          "h-6 w-6",
          color === "primary" && "text-primary",
          color === "success" && "text-success",
          color === "warning" && "text-warning",
          color === "destructive" && "text-destructive"
        )} />
      </div>
    </div>
  </AppleCard>
);

const QuickActionCard = ({ action }: { action: QuickAction }) => {
  const Icon = action.icon;
  const variants = {
    default: "hover:shadow-medium",
    primary: "bg-primary/5 border-primary/20 hover:bg-primary/10",
    success: "bg-success/5 border-success/20 hover:bg-success/10",
    warning: "bg-warning/5 border-warning/20 hover:bg-warning/10"
  };

  return (
    <AppleCard 
      variant="interactive" 
      animation="scale"
      className={cn(
        "group cursor-pointer border transition-all duration-300",
        variants[action.variant || 'default'],
        action.disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!action.disabled ? action.action : undefined}
    >
      <div className="flex items-start space-x-4">
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
          action.variant === 'primary' && "bg-primary/20",
          action.variant === 'success' && "bg-success/20",
          action.variant === 'warning' && "bg-warning/20",
          !action.variant && "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            action.variant === 'primary' && "text-primary",
            action.variant === 'success' && "text-success", 
            action.variant === 'warning' && "text-warning",
            !action.variant && "text-primary"
          )} />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {action.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </AppleCard>
  );
};

const NextStepCard = ({ step }: { step: NextStep }) => {
  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-warning/10 text-warning",
    urgent: "bg-destructive/10 text-destructive"
  };

  const priorityIcons = {
    low: Clock,
    medium: AlertCircle,
    high: AlertCircle,
    urgent: AlertCircle
  };

  const Icon = priorityIcons[step.priority];

  return (
    <AppleCard variant="default" className="group hover:shadow-medium transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon className={cn(
            "h-5 w-5 mt-0.5",
            step.priority === 'low' && "text-muted-foreground",
            step.priority === 'medium' && "text-primary",
            step.priority === 'high' && "text-warning",
            step.priority === 'urgent' && "text-destructive"
          )} />
          <div>
            <h4 className="font-medium text-foreground">{step.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            {step.dueDate && (
              <p className="text-xs text-muted-foreground mt-2">
                กำหนด: {step.dueDate}
              </p>
            )}
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className={cn("text-xs", priorityColors[step.priority])}
        >
          {step.priority === 'urgent' ? 'ด่วน' : 
           step.priority === 'high' ? 'สูง' :
           step.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
        </Badge>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
      >
        {step.action}
      </Button>
    </AppleCard>
  );
};

export const AppleStyleDashboard: React.FC<AppleStyleDashboardProps> = ({
  userName,
  stats,
  quickActions,
  nextSteps,
  knowledgeTestPassed,
  onKnowledgeTestClick,
  className
}) => {
  return (
    <div className={cn("space-y-8 p-6", className)}>
      {/* Welcome Hero */}
      <AppleCard variant="hero" size="lg" animation="slide">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              สวัสดี {userName} 👋
            </h1>
            <p className="text-white/80">
              ยินดีต้อนรับสู่แพลตฟอร์ม GACP Certification
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-white/80">
              <Bell className="h-4 w-4" />
              <span className="text-sm">3 การแจ้งเตือนใหม่</span>
            </div>
          </div>
        </div>
      </AppleCard>

      {/* Progress Tracker */}
      <AppleCard variant="default" size="md" animation="fade">
        <ProgressTracker currentStep={knowledgeTestPassed ? 3 : 2} />
      </AppleCard>

      {/* Knowledge Test Alert */}
      {!knowledgeTestPassed && (
        <AppleCard variant="default" size="md" className="border-warning/20 bg-warning/5">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-warning/20 rounded-xl">
              <Brain className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                จำเป็นต้องทำแบบทดสอบความรู้ก่อน
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                คุณต้องผ่านแบบทดสอบความรู้ GACP ก่อนที่จะสามารถสมัครขอใบรับรองได้
              </p>
              <Button 
                onClick={onKnowledgeTestClick}
                className="mt-4"
                variant="default"
              >
                <Brain className="h-4 w-4 mr-2" />
                เริ่มทำแบบทดสอบ
              </Button>
            </div>
          </div>
        </AppleCard>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="ใบสมัครทั้งหมด"
          value={stats.totalApplications}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="กำลังดำเนินการ"
          value={stats.pendingApplications}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="ได้รับใบรับรอง"
          value={stats.approvedApplications}
          icon={Award}
          color="success"
        />
        <StatCard
          title="คะแนนทดสอบ"
          value={`${stats.knowledgeTestScore}%`}
          icon={Brain}
          color={stats.knowledgeTestScore >= 80 ? "success" : "warning"}
        />
      </div>

      {/* Quick Actions */}
      {knowledgeTestPassed && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">ขั้นตอนถัดไป</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {nextSteps.map((step, index) => (
              <NextStepCard key={index} step={step} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};