import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LiveApplicationStepper from '@/components/workflow/LiveApplicationStepper';
import { MockPaymentFlow } from '@/components/payments/MockPaymentFlow';
import { 
  User, 
  FileText, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  MessageCircle,
  ArrowRight,
  GraduationCap,
  Shield
} from 'lucide-react';

// Mock data for demonstration
const mockApplicationStatus = {
  currentStep: 3,
  totalSteps: 8,
  steps: [
    { id: 1, name: "Register & Verify Identity", status: "completed", icon: User },
    { id: 2, name: "Knowledge Test", status: "completed", icon: GraduationCap },
    { id: 3, name: "Submit Documents", status: "current", icon: FileText },
    { id: 4, name: "Payment (5,000)", status: "pending", icon: CreditCard },
    { id: 5, name: "Document Review", status: "pending", icon: Shield },
    { id: 6, name: "Payment (25,000)", status: "pending", icon: CreditCard },
    { id: 7, name: "Assessment", status: "pending", icon: Calendar },
    { id: 8, name: "Certificate", status: "pending", icon: Download }
  ]
};

const mockNotifications = [
  {
    id: 1,
    type: "warning",
    title: "Documents Required",
    message: "Please upload your farm registration documents to continue.",
    action: "Upload Documents",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    type: "info",
    title: "Knowledge Test Passed",
    message: "Congratulations! You passed the GACP knowledge test with 85%.",
    timestamp: "1 day ago"
  }
];

const EnhancedApplicantDashboard = () => {
  const { user } = useAuth();
  const [showChatbot, setShowChatbot] = useState(false);

  const getStepStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-500', icon: CheckCircle, variant: 'default' as const };
      case 'current':
        return { color: 'bg-blue-500', icon: Clock, variant: 'default' as const };
      default:
        return { color: 'bg-gray-300', icon: AlertCircle, variant: 'secondary' as const };
    }
  };

  const currentStep = mockApplicationStatus.steps.find(step => step.status === 'current');
  const progress = (mockApplicationStatus.currentStep / mockApplicationStatus.totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧑‍🌾 Applicant Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.profile?.full_name || 'Applicant'}! Track your GACP certification progress.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Live Application Stepper with Real Data */}
          <LiveApplicationStepper />

          {/* Current Step Details */}
          {currentStep && (
            <Card className="border-0 shadow-lg border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-700">
                  Next Action Required: {currentStep.name}
                </CardTitle>
                <CardDescription>
                  Complete this step to continue your certification process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Please upload the required documents to proceed with your GACP certification application.
                    Our AI assistant can help guide you through this process.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button className="gap-2">
                      <FileText className="h-4 w-4" />
                      Upload Documents
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setShowChatbot(!showChatbot)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Ask AI Assistant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and helpful resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs">Retake Test</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">View Documents</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Payment History</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Schedule Meeting</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.profile?.full_name}</p>
                    <p className="text-sm text-gray-500">{user?.profile?.email}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Role</p>
                      <p className="font-medium capitalize">{user?.profile?.role}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Notifications
                <Badge variant="secondary">{mockNotifications.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNotifications.map((notification) => (
                  <div key={notification.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
                        {notification.action && (
                          <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                            {notification.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Preview */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get instant help with your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  "Hi! I'm here to help you through your GACP certification process. 
                  Would you like me to explain what documents you need to submit?"
                </p>
                
                <Button 
                  className="w-full gap-2"
                  onClick={() => setShowChatbot(!showChatbot)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Start Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Chatbot Toggle */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50">
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">GACP AI Assistant</h3>
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
              AI Chatbot Interface Coming Soon!<br/>
              This will provide context-aware guidance for your application process.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedApplicantDashboard;