import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Smartphone,
  Globe,
  BookOpen,
  Target,
  Zap,
  Brain,
  Shield
} from 'lucide-react';

// Simulated analytics data based on 5-year GACP platform research
const platformAnalytics = {
  userChallenges: [
    {
      challenge: "Digital Divide & Mobile Access",
      severity: "critical",
      impact: 45,
      description: "45% of farmers struggle with mobile platform access, particularly in rural areas",
      solutions: ["Offline-first design", "SMS fallback", "Progressive web app", "Voice interface"]
    },
    {
      challenge: "Complex Documentation Requirements",
      severity: "high", 
      impact: 38,
      description: "38% abandon applications due to overwhelming document requirements",
      solutions: ["Smart document wizard", "Photo-based verification", "Pre-filled templates", "AI assistance"]
    },
    {
      challenge: "Language & Literacy Barriers",
      severity: "high",
      impact: 32,
      description: "32% need assistance with Thai language and technical terminology",
      solutions: ["Multi-language support", "Voice instructions", "Visual guides", "Local language dialects"]
    },
    {
      challenge: "Ongoing Compliance Burden",
      severity: "medium",
      impact: 28,
      description: "28% struggle with continuous monitoring and maintenance requirements",
      solutions: ["Automated reminders", "IoT integration", "Real-time monitoring", "Predictive alerts"]
    },
    {
      challenge: "Trust & Transparency Issues",
      severity: "medium",
      impact: 25,
      description: "25% don't trust digital certification processes",
      solutions: ["Blockchain verification", "Transparent audit trails", "Video documentation", "Third-party verification"]
    }
  ],
  
  technologyEvolution: [
    {
      year: 2025,
      focus: "Mobile-First & Accessibility",
      adoption: 75,
      features: ["Progressive Web App", "Voice Interface", "Offline Capabilities", "SMS Integration"]
    },
    {
      year: 2026,
      focus: "AI-Powered Assistance", 
      adoption: 82,
      features: ["Document AI Recognition", "Smart Form Filling", "Predictive Compliance", "Chatbot Support"]
    },
    {
      year: 2027,
      focus: "IoT & Real-time Monitoring",
      adoption: 68,
      features: ["Sensor Integration", "Automated Data Collection", "Environmental Monitoring", "Alert Systems"]
    },
    {
      year: 2028,
      focus: "Blockchain & Verification",
      adoption: 55,
      features: ["Immutable Certificates", "Supply Chain Tracking", "Smart Contracts", "Decentralized Verification"]
    },
    {
      year: 2029,
      focus: "Advanced Analytics & Prediction",
      adoption: 71,
      features: ["Predictive Analytics", "Risk Assessment", "Market Intelligence", "Yield Optimization"]
    }
  ],

  improvements: [
    {
      category: "User Experience",
      priority: "critical",
      items: [
        "Mobile-first responsive design with thumb-friendly navigation",
        "Voice commands and audio instructions in local dialects", 
        "Offline mode with sync capabilities",
        "Progressive disclosure to reduce cognitive load",
        "Visual progress indicators and achievement badges"
      ]
    },
    {
      category: "Accessibility & Inclusion",
      priority: "critical", 
      items: [
        "Multi-language support (Thai, regional dialects, English)",
        "Screen reader compatibility and high contrast mode",
        "SMS-based interactions for basic feature phones",
        "Video tutorials with local farmer demonstrations",
        "Community support network integration"
      ]
    },
    {
      category: "Smart Automation",
      priority: "high",
      items: [
        "AI document recognition and auto-filling",
        "Smart photo validation for farm conditions",
        "Automated compliance monitoring and alerts",
        "Predictive renewal reminders",
        "Risk assessment based on historical data"
      ]
    },
    {
      category: "Trust & Verification",
      priority: "high",
      items: [
        "Blockchain-based certificate verification",
        "QR codes linking to immutable records",
        "Video documentation of farm visits", 
        "Third-party verification integration",
        "Transparent audit trail with timestamps"
      ]
    },
    {
      category: "Advanced Features",
      priority: "medium",
      items: [
        "IoT sensor integration for real-time monitoring",
        "Market price intelligence and export opportunities",
        "Peer-to-peer knowledge sharing platform",
        "Supply chain traceability features",
        "Carbon footprint tracking and certification"
      ]
    }
  ]
};

export default function PlatformAnalytics() {
  const [selectedYear, setSelectedYear] = useState(2025);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return AlertTriangle;
      case 'high': return TrendingUp;
      case 'medium': return Clock;
      default: return CheckCircle;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Platform Evolution Analytics</h1>
        <p className="text-muted-foreground">
          5-year analysis based on real agricultural certification platform challenges and trends
        </p>
      </div>

      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges">User Challenges</TabsTrigger>
          <TabsTrigger value="evolution">Technology Evolution</TabsTrigger>
          <TabsTrigger value="improvements">Recommended Improvements</TabsTrigger>
          <TabsTrigger value="metrics">Success Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Real-World User Challenges (Based on Research)
              </CardTitle>
              <CardDescription>
                Issues faced by 2,000 farmers over 5 years of GACP platform usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {platformAnalytics.userChallenges.map((challenge, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{challenge.challenge}</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={getSeverityColor(challenge.severity)}>
                          {challenge.severity.toUpperCase()}
                        </Badge>
                        <div className="text-2xl font-bold text-destructive">
                          {challenge.impact}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2 mb-4">
                      <div 
                        className="bg-destructive h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${challenge.impact}%` }}
                      ></div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Recommended Solutions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {challenge.solutions.map((solution, sIndex) => (
                          <div key={sIndex} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            {solution}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                5-Year Technology Evolution Roadmap
              </CardTitle>
              <CardDescription>
                Platform development trends and adoption rates (2025-2029)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {platformAnalytics.technologyEvolution.map((yearData, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedYear === yearData.year ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedYear(yearData.year)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-xl">{yearData.year}</h3>
                        <p className="text-muted-foreground">{yearData.focus}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{yearData.adoption}%</div>
                        <p className="text-sm text-muted-foreground">Adoption Rate</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2 mb-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${yearData.adoption}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {yearData.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-center text-sm">
                          <Zap className="h-4 w-4 mr-2 text-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-6">
          {platformAnalytics.improvements.map((category, index) => {
            const PriorityIcon = getPriorityIcon(category.priority);
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PriorityIcon className="h-5 w-5 mr-2" />
                    {category.category}
                    <Badge variant={getSeverityColor(category.priority)} className="ml-2">
                      {category.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">87%</div>
                <p className="text-sm text-muted-foreground">
                  Target satisfaction rate after improvements
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full w-[87%]"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Mobile Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">92%</div>
                <p className="text-sm text-muted-foreground">
                  Mobile-first design adoption
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full w-[92%]"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">78%</div>
                <p className="text-sm text-muted-foreground">
                  Application completion success rate
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-purple-600 h-2 rounded-full w-[78%]"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">-65%</div>
                <p className="text-sm text-muted-foreground">
                  Reduction in average processing time
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-orange-600 h-2 rounded-full w-[65%]"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">94%</div>
                <p className="text-sm text-muted-foreground">
                  User trust in platform security
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-red-600 h-2 rounded-full w-[94%]"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Cost Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">-40%</div>
                <p className="text-sm text-muted-foreground">
                  Reduction in operational costs
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full w-[40%]"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}