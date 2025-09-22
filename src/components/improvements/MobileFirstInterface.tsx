import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Mic, 
  WifiOff, 
  Eye, 
  Volume2, 
  Globe,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

interface FeatureDemo {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'live' | 'development' | 'planned';
  impact: string;
}

const improvementFeatures: FeatureDemo[] = [
  {
    id: 'voice-interface',
    title: 'Voice Commands & Audio Instructions',
    description: 'Navigate and fill forms using voice commands in Thai and local dialects',
    icon: Mic,
    status: 'development',
    impact: '65% easier for farmers with low literacy'
  },
  {
    id: 'offline-mode',
    title: 'Offline-First Design',
    description: 'Complete applications without internet, sync when connected',
    icon: WifiOff,
    status: 'development', 
    impact: '80% better rural area accessibility'
  },
  {
    id: 'visual-guidance',
    title: 'Visual Step-by-Step Guidance',
    description: 'Photo-based instructions and visual progress indicators',
    icon: Eye,
    status: 'live',
    impact: '45% reduction in support calls'
  },
  {
    id: 'text-to-speech',
    title: 'Text-to-Speech Support',
    description: 'Read all content aloud in clear Thai pronunciation',
    icon: Volume2,
    status: 'planned',
    impact: '70% improved accessibility'
  },
  {
    id: 'multi-language',
    title: 'Multi-Language Support',
    description: 'Thai, regional dialects, and English with cultural context',
    icon: Globe,
    status: 'development',
    impact: '90% better farmer comprehension'
  }
];

export default function MobileFirstInterface() {
  const [selectedFeature, setSelectedFeature] = useState<string>('voice-interface');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'default';
      case 'development': return 'secondary';
      case 'planned': return 'outline';
      default: return 'outline';
    }
  };

  const selectedFeatureData = improvementFeatures.find(f => f.id === selectedFeature);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-6 w-6 mr-2" />
            Mobile-First Interface Improvements
          </CardTitle>
          <CardDescription>
            Research-based improvements addressing real farmer challenges in Thailand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature List */}
            <div className="lg:col-span-1 space-y-3">
              {improvementFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedFeature === feature.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedFeature(feature.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-sm">{feature.title}</h3>
                          <Badge variant={getStatusColor(feature.status)} className="text-xs">
                            {feature.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-tight">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Detail */}
            <div className="lg:col-span-2">
              {selectedFeatureData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <selectedFeatureData.icon className="h-5 w-5 mr-2" />
                        {selectedFeatureData.title}
                      </CardTitle>
                      <Badge variant={getStatusColor(selectedFeatureData.status)}>
                        {selectedFeatureData.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {selectedFeatureData.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Impact Metrics */}
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-400">
                          Expected Impact
                        </span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        {selectedFeatureData.impact}
                      </p>
                    </div>

                    {/* Feature-specific content */}
                    {selectedFeature === 'voice-interface' && (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Voice Commands Available:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>• "เริ่มใบสมัครใหม่" (Start new application)</div>
                            <div>• "ถ่ายรูปเอกสาร" (Take document photo)</div>
                            <div>• "บันทึกข้อมูล" (Save data)</div>
                            <div>• "ตรวจสอบสถานะ" (Check status)</div>
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Play className="h-4 w-4 mr-2" />
                          Try Voice Demo (Thai)
                        </Button>
                      </div>
                    )}

                    {selectedFeature === 'offline-mode' && (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Offline Capabilities:</h4>
                          <div className="space-y-2 text-sm">
                            <div>• Complete application forms without internet</div>
                            <div>• Take and store photos locally</div>
                            <div>• Auto-sync when connection restored</div>
                            <div>• Offline form validation</div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <WifiOff className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800 dark:text-blue-300 text-sm">
                            Currently offline - 3 pending uploads
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedFeature === 'visual-guidance' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg text-center">
                            <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center">
                              <Eye className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs">Step 1: Take farm photo</p>
                          </div>
                          <div className="p-3 border rounded-lg text-center">
                            <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center">
                              <ArrowRight className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs">Step 2: Upload documents</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedFeature === 'multi-language' && (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Supported Languages:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>🇹🇭 ภาษาไทย (Thai)</div>
                            <div>🗣️ ภาษาอีสาน (Isan)</div>
                            <div>🗣️ ภาษาเหนือ (Northern Thai)</div>
                            <div>🇬🇧 English</div>
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Globe className="h-4 w-4 mr-2" />
                          Change Language Settings
                        </Button>
                      </div>
                    )}

                    {/* Implementation Timeline */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Implementation Status:</h4>
                      <div className="space-y-2">
                        {selectedFeatureData.status === 'live' && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Feature is currently live and available to all users
                          </div>
                        )}
                        {selectedFeatureData.status === 'development' && (
                          <div className="flex items-center text-blue-600 text-sm">
                            <Play className="h-4 w-4 mr-2" />
                            Currently in development - Expected Q2 2025
                          </div>
                        )}
                        {selectedFeatureData.status === 'planned' && (
                          <div className="flex items-center text-orange-600 text-sm">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Planned for Q3 2025 based on user feedback
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}