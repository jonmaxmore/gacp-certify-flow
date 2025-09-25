import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  MessageCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';

// Mock data for demonstration
const mockApplicationQueue = [
  {
    id: 1,
    applicationNumber: "GACP-0001-2567",
    applicantName: "สมชาย เกษตรกร",
    farmName: "ฟาร์มผักปลอดสาร สมชาย",
    submittedDate: "2024-01-15",
    status: "pending",
    priority: "high",
    documentsCount: 8,
    rejectionCount: 0
  },
  {
    id: 2,
    applicationNumber: "GACP-0002-2567",
    applicantName: "สมหญิง อินทรีย์",
    farmName: "เกษตรอินทรีย์ สมหญิง",
    submittedDate: "2024-01-14",
    status: "needs_review",
    priority: "medium",
    documentsCount: 6,
    rejectionCount: 1
  },
  {
    id: 3,
    applicationNumber: "GACP-0003-2567",
    applicantName: "สมศักดิ์ ปลอดภัย",
    farmName: "ฟาร์มผัก ปลอดภัย",
    submittedDate: "2024-01-13",
    status: "approved",
    priority: "low",
    documentsCount: 10,
    rejectionCount: 0
  }
];

const mockStats = {
  totalApplications: 156,
  pendingReview: 23,
  approvedToday: 8,
  rejectedToday: 2,
  averageReviewTime: "2.5 days"
};

const EnhancedReviewerDashboard = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-amber-500', variant: 'default' as const, label: 'Pending Review' };
      case 'needs_review':
        return { color: 'bg-red-500', variant: 'destructive' as const, label: 'Needs Review' };
      case 'approved':
        return { color: 'bg-green-500', variant: 'default' as const, label: 'Approved' };
      default:
        return { color: 'bg-gray-500', variant: 'secondary' as const, label: 'Unknown' };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'high':
        return { variant: 'destructive' as const, label: 'High Priority' };
      case 'medium':
        return { variant: 'default' as const, label: 'Medium Priority' };
      case 'low':
        return { variant: 'secondary' as const, label: 'Low Priority' };
      default:
        return { variant: 'secondary' as const, label: 'Normal' };
    }
  };

  const filteredApplications = mockApplicationQueue.filter(app => {
    const matchesFilter = selectedFilter === 'all' || app.status === selectedFilter;
    const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.farmName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📝 Reviewer Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.profile?.full_name || 'Reviewer'}! Review and approve GACP applications.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.totalApplications}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.pendingReview}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.approvedToday}</p>
                <p className="text-sm text-gray-600">Approved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.rejectedToday}</p>
                <p className="text-sm text-gray-600">Rejected Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.averageReviewTime}</p>
                <p className="text-sm text-gray-600">Avg Review Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Application Queue */}
        <div className="xl:col-span-3">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Application Queue
                  </CardTitle>
                  <CardDescription>
                    Review and approve GACP certification applications
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
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {['all', 'pending', 'needs_review', 'approved'].map((filter) => (
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

              {/* Application List */}
              <div className="space-y-4">
                {filteredApplications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);
                  const priorityInfo = getPriorityInfo(application.priority);
                  
                  return (
                    <div
                      key={application.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {application.applicationNumber}
                              </h3>
                              <p className="text-gray-600">{application.applicantName}</p>
                              <p className="text-sm text-gray-500">{application.farmName}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                            <Badge variant={priorityInfo.variant}>
                              {priorityInfo.label}
                            </Badge>
                            {application.rejectionCount > 0 && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Rejected {application.rejectionCount}x
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="text-right text-sm text-gray-500">
                            <p>Submitted: {application.submittedDate}</p>
                            <p>{application.documentsCount} documents</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Review
                            </Button>
                            
                            <Button size="sm" variant="outline" className="gap-2">
                              <Download className="h-4 w-4" />
                              Documents
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredApplications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No applications found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <FileCheck className="h-4 w-4" />
                  Bulk Review
                </Button>
                
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Download className="h-4 w-4" />
                  Export Reports
                </Button>
                
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Calendar className="h-4 w-4" />
                  Schedule Reviews
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review Guidelines */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">Review Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-green-700">Check all required documents are present</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-green-700">Verify farm location and size accuracy</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-green-700">Confirm training certificate validity</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-amber-700">
                    <strong>Reject #3:</strong> Triggers 5,000 THB payment
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
                "I can help you understand rejection rules, document requirements, and review guidelines."
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
              <h3 className="font-medium">Reviewer AI Assistant</h3>
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
              AI Assistant for Reviewers Coming Soon!<br/>
              This will help with rejection rules and review guidelines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedReviewerDashboard;