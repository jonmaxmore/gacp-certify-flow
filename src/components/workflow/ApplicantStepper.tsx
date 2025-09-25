import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  User, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Eye, 
  Calendar, 
  Video, 
  Award,
  MessageCircle,
  AlertCircle,
  Clock,
  Download
} from 'lucide-react';

interface StepperStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'locked' | 'pending';
  paymentAmount?: number;
  rejectionCount?: number;
}

const mockSteps: StepperStep[] = [
  {
    id: 'register',
    title: 'Register & Verify Identity',
    description: 'Complete your profile and verify your identity',
    icon: User,
    status: 'completed'
  },
  {
    id: 'knowledge-test',
    title: 'Knowledge Test',
    description: 'Pass the GACP knowledge assessment',
    icon: BookOpen,
    status: 'completed'
  },
  {
    id: 'submit-documents',
    title: 'Submit Documents',
    description: 'Upload required certification documents',
    icon: FileText,
    status: 'completed'
  },
  {
    id: 'initial-payment',
    title: 'Initial Review Payment',
    description: 'Pay for document review process',
    icon: CreditCard,
    status: 'completed',
    paymentAmount: 5000
  },
  {
    id: 'document-review',
    title: 'Document Review',
    description: 'Reviewer evaluates your submitted documents',
    icon: Eye,
    status: 'current',
    rejectionCount: 0
  },
  {
    id: 'assessment-payment',
    title: 'Assessment Fee Payment',
    description: 'Pay for on-site/online assessment',
    icon: CreditCard,
    status: 'locked',
    paymentAmount: 25000
  },
  {
    id: 'schedule-assessment',
    title: 'Schedule Assessment',
    description: 'Book your assessment date and time',
    icon: Calendar,
    status: 'locked'
  },
  {
    id: 'assessment',
    title: 'Assessment',
    description: 'Complete your certification assessment',
    icon: Video,
    status: 'locked'
  },
  {
    id: 'certificate',
    title: 'Download Certificate',
    description: 'Get your GACP certificate',
    icon: Award,
    status: 'locked'
  }
];

const ApplicantStepper = () => {
  const [steps, setSteps] = useState(mockSteps);
  const [showChatbot, setShowChatbot] = useState(false);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.status === 'current');
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getStepIcon = (step: StepperStep) => {
    const IconComponent = step.icon;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'current':
        return <IconComponent className="h-8 w-8 text-primary" />;
      case 'locked':
        return <Lock className="h-8 w-8 text-gray-400" />;
      default:
        return <Circle className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStepStatus = (step: StepperStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'current':
        return <Badge className="bg-blue-100 text-blue-800">Current</Badge>;
      case 'locked':
        return <Badge variant="secondary">Locked</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCurrentStepDetails = () => {
    const currentStep = steps.find(step => step.status === 'current');
    if (!currentStep) return null;

    switch (currentStep.id) {
      case 'document-review':
        return (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Document Review in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Status: Under Review</p>
                    <p className="text-sm text-gray-600">
                      Estimated review time: 2-3 business days
                    </p>
                  </div>
                </div>
                
                {currentStep.rejectionCount !== undefined && currentStep.rejectionCount > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Previous Rejections: {currentStep.rejectionCount}
                      </p>
                      <p className="text-sm text-amber-700">
                        {currentStep.rejectionCount >= 2 
                          ? 'Next rejection will require additional payment'
                          : 'You have free resubmissions remaining'
                        }
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setShowChatbot(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat with AI Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStepIcon(currentStep)}
                {currentStep.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{currentStep.description}</p>
              <Button className="w-full gap-2">
                Continue
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Certification Progress</span>
            <Badge variant="outline">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {Math.round(getProgressPercentage())}% Complete
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      {getCurrentStepDetails()}

      {/* Steps List */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  step.status === 'current' 
                    ? 'bg-blue-50 border-blue-200' 
                    : step.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{step.title}</h3>
                    {getStepStatus(step)}
                    {step.paymentAmount && (
                      <Badge variant="outline" className="text-xs">
                        ฿{step.paymentAmount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  
                  {step.rejectionCount !== undefined && step.rejectionCount > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Rejections: {step.rejectionCount}
                      </Badge>
                    </div>
                  )}
                </div>

                {step.status === 'current' && (
                  <Button size="sm" className="gap-2">
                    {step.id === 'document-review' ? (
                      <>
                        <Eye className="h-4 w-4" />
                        View Status
                      </>
                    ) : step.id === 'initial-payment' || step.id === 'assessment-payment' ? (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </>
                    ) : step.id === 'certificate' ? (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Chatbot Widget */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50">
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">AI Guide</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setShowChatbot(false)}
              >
                ×
              </Button>
            </div>
          </div>
          <div className="p-4 h-80 bg-gray-50 rounded-b-lg">
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-sm">
                  👋 Hi! I'm here to help you through the certification process.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-sm">
                  Your documents are currently under review. The reviewer will check:
                  <br />• Document completeness
                  <br />• Format compliance  
                  <br />• Content accuracy
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  💡 Tip: You'll receive an email notification once the review is complete!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantStepper;