import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentMeeting {
  id: string;
  type: 'online' | 'onsite';
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed';
  meetingUrl?: string;
  location?: string;
  auditorName?: string;
  auditorContact?: string;
  notes?: string;
}

interface AssessmentSchedulerProps {
  meetings?: AssessmentMeeting[];
  onJoinMeeting?: (meetingId: string) => void;
  className?: string;
}

const AssessmentScheduler: React.FC<AssessmentSchedulerProps> = ({
  meetings = [],
  onJoinMeeting,
  className
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock meetings data
  const defaultMeetings: AssessmentMeeting[] = [
    {
      id: '1',
      type: 'online',
      date: '2024-01-20',
      time: '14:00',
      duration: 120,
      status: 'scheduled',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      auditorName: 'อาจารย์สมชาย ใจดี',
      auditorContact: 'somchai@gacp.org',
      notes: 'เตรียมเอกสารการปลูกพืชและแผนที่ฟาร์ม'
    },
    {
      id: '2',
      type: 'onsite',
      date: '2024-01-25',
      time: '09:00',
      duration: 240,
      status: 'scheduled',
      location: 'ฟาร์มแปลงใหญ่ ต.บ้านใหม่ อ.เมือง จ.เชียงใหม่',
      auditorName: 'ดร.วิชัย เกษตรกร',
      auditorContact: '089-123-4567',
      notes: 'ตรวจสอบพื้นที่การปลูก ระบบการจัดการน้ำ และสถานที่เก็บผลผลิต'
    }
  ];

  const allMeetings = meetings.length > 0 ? meetings : defaultMeetings;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: 'นัดหมายแล้ว', variant: 'default' as const, icon: Calendar },
      'in-progress': { label: 'กำลังดำเนินการ', variant: 'default' as const, icon: Clock },
      completed: { label: 'เสร็จสิ้น', variant: 'default' as const, icon: CheckCircle },
      missed: { label: 'ไม่เข้าร่วม', variant: 'destructive' as const, icon: AlertTriangle }
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

  const getTimeUntilMeeting = (date: string, time: string): string => {
    const meetingDateTime = new Date(`${date}T${time}:00`);
    const diffInMinutes = Math.floor((meetingDateTime.getTime() - currentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 0) {
      return 'เวลาผ่านมาแล้ว';
    } else if (diffInMinutes < 60) {
      return `อีก ${diffInMinutes} นาที`;
    } else if (diffInMinutes < 1440) {
      return `อีก ${Math.floor(diffInMinutes / 60)} ชั่วโมง`;
    } else {
      return `อีก ${Math.floor(diffInMinutes / 1440)} วัน`;
    }
  };

  const isMeetingJoinable = (date: string, time: string): boolean => {
    const meetingDateTime = new Date(`${date}T${time}:00`);
    const diffInMinutes = Math.floor((meetingDateTime.getTime() - currentTime.getTime()) / (1000 * 60));
    
    // Allow joining 15 minutes before to 30 minutes after start time
    return diffInMinutes <= 15 && diffInMinutes >= -30;
  };

  const formatDateTime = (date: string, time: string): string => {
    const meetingDate = new Date(`${date}T${time}:00`);
    return meetingDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ตารางการประเมิน
          </CardTitle>
          <CardDescription>
            การนัดหมายประเมินออนไลน์และในพื้นที่
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {allMeetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีการนัดหมายประเมิน</p>
            </div>
          ) : (
            allMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      meeting.type === 'online' 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-green-100 text-green-600"
                    )}>
                      {meeting.type === 'online' ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-lg">
                        การประเมิน{meeting.type === 'online' ? 'ออนไลน์' : 'ในพื้นที่'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(meeting.date, meeting.time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(meeting.status)}
                    {meeting.status === 'scheduled' && (
                      <div className="text-sm font-medium text-orange-600">
                        {getTimeUntilMeeting(meeting.date, meeting.time)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Meeting Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>ระยะเวลา: {meeting.duration} นาที</span>
                    </div>
                    
                    {meeting.auditorName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>ผู้ประเมิน: {meeting.auditorName}</span>
                      </div>
                    )}
                    
                    {meeting.auditorContact && (
                      <div className="flex items-center gap-2 text-sm">
                        {meeting.auditorContact.includes('@') ? (
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{meeting.auditorContact}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {meeting.type === 'online' && meeting.meetingUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">ลิงก์การประเมิน:</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={isMeetingJoinable(meeting.date, meeting.time) ? "default" : "outline"}
                            size="sm"
                            disabled={!isMeetingJoinable(meeting.date, meeting.time)}
                            onClick={() => {
                              if (onJoinMeeting) {
                                onJoinMeeting(meeting.id);
                              } else {
                                window.open(meeting.meetingUrl, '_blank');
                              }
                            }}
                            className="gap-2"
                          >
                            <Video className="h-4 w-4" />
                            {isMeetingJoinable(meeting.date, meeting.time) 
                              ? 'เข้าร่วมการประเมิน' 
                              : 'ยังไม่ถึงเวลา'
                            }
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {meeting.type === 'onsite' && meeting.location && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">สถานที่:</p>
                        <p className="text-sm text-muted-foreground">
                          {meeting.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {meeting.notes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      หมายเหตุการเตรียมตัว:
                    </p>
                    <p className="text-sm text-blue-700">
                      {meeting.notes}
                    </p>
                  </div>
                )}

                {/* Countdown Timer for Active Meetings */}
                {meeting.status === 'scheduled' && isMeetingJoinable(meeting.date, meeting.time) && (
                  <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        พร้อมเข้าร่วมการประเมิน
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentScheduler;