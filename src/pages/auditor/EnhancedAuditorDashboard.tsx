import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  VideoIcon,
  Search,
  MessageCircle,
  Camera,
  FileText,
  TrendingUp,
  AlertCircle,
  Phone,
  Monitor
} from 'lucide-react';

// Mock data for demonstration
const mockAssessmentQueue = [
  {
    id: 1,
    applicationNumber: "GACP-0001-2567",
    applicantName: "สมชาย เกษตรกร",
    farmName: "ฟาร์มผักปลอดสาร สมชาย",
    assessmentType: "online",
    scheduledDate: "2024-01-20",
    scheduledTime: "10:00",
    status: "scheduled",
    location: "Online Meeting",
    paymentStatus: "confirmed"
  },
  {
    id: 2,
    applicationNumber: "GACP-0002-2567", 
    applicantName: "สมหญิง อินทรีย์",
    farmName: "เกษตรอินทรีย์ สมหญิง",
    assessmentType: "onsite",
    scheduledDate: "2024-01-22",
    scheduledTime: "09:00",
    status: "pending_schedule",
    location: "นครปธม",
    paymentStatus: "confirmed"
  },
  {
    id: 3,
    applicationNumber: "GACP-0003-2567",
    applicantName: "สมศักดิ์ ปลอดภัย", 
    farmName: "ฟาร์มผัก ปลอดภัย",
    assessmentType: "online",
    scheduledDate: "2024-01-18",
    scheduledTime: "14:00",
    status: "completed",
    location: "Online Meeting",
    paymentStatus: "confirmed"
  }
];

const mockStats = {
  totalAssessments: 45,
  scheduledToday: 3,
  completedToday: 2,
  pendingSchedule: 8,
  passRate: "85%"
};

const EnhancedAuditorDashboard = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { color: 'bg-blue-500', variant: 'default' as const, label: 'Scheduled' };
      case 'pending_schedule':
        return { color: 'bg-amber-500', variant: 'default' as const, label: 'Pending Schedule' };
      case 'completed':
        return { color: 'bg-green-500', variant: 'default' as const, label: 'Completed' };
      case 'in_progress':
        return { color: 'bg-purple-500', variant: 'default' as const, label: 'In Progress' };
      default:
        return { color: 'bg-gray-500', variant: 'secondary' as const, label: 'Unknown' };
    }
  };

  const getAssessmentTypeInfo = (type: string) => {
    switch (type) {
      case 'online':
        return { icon: VideoIcon, label: 'Online Assessment', color: 'text-blue-600' };
      case 'onsite':
        return { icon: MapPin, label: 'Onsite Assessment', color: 'text-green-600' };
      default:
        return { icon: Calendar, label: 'Assessment', color: 'text-gray-600' };
    }
  };

  const filteredAssessments = mockAssessmentQueue.filter(assessment => {
    const matchesFilter = selectedFilter === 'all' || assessment.status === selectedFilter;
    const matchesSearch = assessment.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.farmName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const todayAssessments = mockAssessmentQueue.filter(assessment => 
    assessment.scheduledDate === "2024-01-20" && assessment.status === 'scheduled'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🕵️ Auditor Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.profile?.full_name || 'Auditor'}! Manage and conduct GACP assessments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.totalAssessments}</p>
                <p className="text-sm text-gray-600">Total Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.scheduledToday}</p>
                <p className="text-sm text-gray-600">Scheduled Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.completedToday}</p>
                <p className="text-sm text-gray-600">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.pendingSchedule}</p>
                <p className="text-sm text-gray-600">Pending Schedule</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.passRate}</p>
                <p className="text-sm text-gray-600">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Assessment Queue */}
        <div className="xl:col-span-3">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Assessment Queue
                  </CardTitle>
                  <CardDescription>
                    Schedule and conduct GACP assessments (Approved & Assessment Fee Paid)
                  </CardDescription>
                </div>
                
                <Button 
                  className="gap-2"
                  onClick={() => setShowChatbot(!showChatbot)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask AI Assistant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {['all', 'pending_schedule', 'scheduled', 'completed'].map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                      className="capitalize"
                    >
                      {filter.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Assessment List */}
              <div className="space-y-4">
                {filteredAssessments.map((assessment) => {
                  const statusInfo = getStatusInfo(assessment.status);
                  const typeInfo = getAssessmentTypeInfo(assessment.assessmentType);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <div
                      key={assessment.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {assessment.applicationNumber}
                              </h3>
                              <p className="text-gray-600">{assessment.applicantName}</p>
                              <p className="text-sm text-gray-500">{assessment.farmName}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <TypeIcon className="h-3 w-3" />
                              {typeInfo.label}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {assessment.location}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="text-right text-sm text-gray-500">
                            <p>Date: {assessment.scheduledDate}</p>
                            <p>Time: {assessment.scheduledTime}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {assessment.status === 'pending_schedule' && (
                              <Button size="sm" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                Schedule
                              </Button>
                            )}
                            
                            {assessment.status === 'scheduled' && (
                              <>
                                {assessment.assessmentType === 'online' ? (
                                  <Button size="sm" className="gap-2">
                                    <VideoIcon className="h-4 w-4" />
                                    Join Meeting
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="gap-2">
                                    <MapPin className="h-4 w-4" />
                                    View Location
                                  </Button>
                                )}
                              </>
                            )}
                            
                            {assessment.status === 'completed' && (
                              <Button size="sm" variant="outline" className="gap-2">
                                <FileText className="h-4 w-4" />
                                View Report
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredAssessments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No assessments found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className="border-0 shadow-lg border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700">Today's Schedule</CardTitle>
              <CardDescription>
                {todayAssessments.length} assessments scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAssessments.map((assessment) => {
                  const typeInfo = getAssessmentTypeInfo(assessment.assessmentType);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <div key={assessment.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <TypeIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assessment.scheduledTime}</p>
                        <p className="text-xs text-gray-600">{assessment.applicantName}</p>
                      </div>
                    </div>
                  );
                })}
                
                {todayAssessments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No assessments scheduled for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Calendar className="h-4 w-4" />
                  Schedule Assessment
                </Button>
                
                <Button className="w-full justify-start gap-2" variant="outline">
                  <VideoIcon className="h-4 w-4" />
                  Generate Meeting Link
                </Button>
                
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Camera className="h-4 w-4" />
                  Upload Evidence
                </Button>
                
                <Button className="w-full justify-start gap-2" variant="outline">
                  <FileText className="h-4 w-4" />
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Checklist */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-emerald-800">Assessment Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-emerald-700">Verify farm location matches application</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-emerald-700">Check GACP implementation practices</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-emerald-700">Capture evidence photos/screenshots</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-emerald-700">Complete assessment form</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-amber-700">
                    <strong>Pass:</strong> Certificate unlocked
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-red-700">
                    <strong>Fail:</strong> Return to reviewer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                "I can help you schedule assessments, find available times, and guide you through the assessment checklist."
              </p>
              
              <Button 
                className="w-full gap-2"
                onClick={() => setShowChatbot(!showChatbot)}
              >
                <MessageCircle className="h-4 w-4" />
                Get Help
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50">
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Auditor AI Assistant</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowChatbot(false)}
              >
                ×
              </Button>
            </div>
          </div>
          <div className="p-4 h-80 bg-gray-50 rounded-b-lg">
            <p className="text-sm text-gray-600 text-center">
              AI Assistant for Auditors Coming Soon!<br/>
              This will help with scheduling, available times, and assessment guidelines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAuditorDashboard;