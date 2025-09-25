import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Settings,
  Database,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  progress: number;
  tests: Test[];
  lastRun?: string;
}

interface Test {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

export const SystemTestDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    initializeTestSuites();
  }, []);

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        id: 'database',
        name: 'การทดสอบฐานข้อมูล',
        description: 'ทดสอบการเชื่อมต่อและการทำงานของฐานข้อมูล',
        status: 'idle',
        progress: 0,
        tests: [
          { id: 'db-connection', name: 'การเชื่อมต่อฐานข้อมูล', status: 'pending' },
          { id: 'db-read', name: 'การอ่านข้อมูล', status: 'pending' },
          { id: 'db-write', name: 'การเขียนข้อมูล', status: 'pending' },
          { id: 'db-performance', name: 'ประสิทธิภาพ', status: 'pending' }
        ]
      },
      {
        id: 'api',
        name: 'การทดสอบ API',
        description: 'ทดสอบ REST API endpoints',
        status: 'idle',
        progress: 0,
        tests: [
          { id: 'api-auth', name: 'การยืนยันตัวตน', status: 'pending' },
          { id: 'api-crud', name: 'CRUD Operations', status: 'pending' },
          { id: 'api-validation', name: 'Data Validation', status: 'pending' },
          { id: 'api-rate-limit', name: 'Rate Limiting', status: 'pending' }
        ]
      },
      {
        id: 'security',
        name: 'การทดสอบความปลอดภัย',
        description: 'ทดสอบระบบรักษาความปลอดภัย',
        status: 'idle',
        progress: 0,
        tests: [
          { id: 'security-auth', name: 'Authentication', status: 'pending' },
          { id: 'security-rls', name: 'Row Level Security', status: 'pending' },
          { id: 'security-injection', name: 'SQL Injection Prevention', status: 'pending' },
          { id: 'security-xss', name: 'XSS Protection', status: 'pending' }
        ]
      },
      {
        id: 'performance',
        name: 'การทดสอบประสิทธิภาพ',
        description: 'ทดสอบความเร็วและประสิทธิภาพของระบบ',
        status: 'idle',
        progress: 0,
        tests: [
          { id: 'perf-load', name: 'Load Testing', status: 'pending' },
          { id: 'perf-response', name: 'Response Time', status: 'pending' },
          { id: 'perf-memory', name: 'Memory Usage', status: 'pending' },
          { id: 'perf-concurrent', name: 'Concurrent Users', status: 'pending' }
        ]
      }
    ];
    setTestSuites(suites);
  };

  const runTestSuite = async (suiteId: string) => {
    setIsRunning(true);
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    // Update suite status
    setTestSuites(suites => 
      suites.map(s => 
        s.id === suiteId 
          ? { ...s, status: 'running', progress: 0 }
          : s
      )
    );

    // Run tests sequentially
    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      
      // Start test
      setTestSuites(suites => 
        suites.map(s => 
          s.id === suiteId 
            ? {
                ...s,
                tests: s.tests.map(t => 
                  t.id === test.id 
                    ? { ...t, status: 'running' }
                    : t
                )
              }
            : s
        )
      );

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Complete test (90% success rate for demo)
      const passed = Math.random() > 0.1;
      const duration = Math.floor(500 + Math.random() * 1500);
      
      setTestSuites(suites => 
        suites.map(s => 
          s.id === suiteId 
            ? {
                ...s,
                progress: ((i + 1) / s.tests.length) * 100,
                tests: s.tests.map(t => 
                  t.id === test.id 
                    ? { 
                        ...t, 
                        status: passed ? 'passed' : 'failed',
                        duration,
                        error: passed ? undefined : 'Test failed with mock error'
                      }
                    : t
                )
              }
            : s
        )
      );
    }

    // Complete suite
    const allPassed = suite.tests.every(() => Math.random() > 0.1);
    setTestSuites(suites => 
      suites.map(s => 
        s.id === suiteId 
          ? { 
              ...s, 
              status: allPassed ? 'passed' : 'failed',
              lastRun: new Date().toISOString()
            }
          : s
      )
    );
    
    setIsRunning(false);
  };

  const runAllTests = async () => {
    for (const suite of testSuites) {
      await runTestSuite(suite.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <PlayCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge variant="info">กำลังทดสอบ</Badge>;
      case 'passed': return <Badge variant="success">ผ่าน</Badge>;
      case 'failed': return <Badge variant="destructive">ไม่ผ่าน</Badge>;
      default: return <Badge variant="secondary">รอการทดสอบ</Badge>;
    }
  };

  const getSuiteIcon = (suiteId: string) => {
    switch (suiteId) {
      case 'database': return Database;
      case 'api': return Globe;
      case 'security': return Shield;
      case 'performance': return Zap;
      default: return Settings;
    }
  };

  if (user?.profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-4" />
            <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ระบบทดสอบ</h1>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          {isRunning ? 'กำลังทดสอบ...' : 'ทดสอบทั้งหมด'}
        </Button>
      </div>

      {/* Test Suites Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testSuites.map((suite) => {
          const SuiteIcon = getSuiteIcon(suite.id);
          const passedTests = suite.tests.filter(t => t.status === 'passed').length;
          const failedTests = suite.tests.filter(t => t.status === 'failed').length;
          
          return (
            <Card key={suite.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <SuiteIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{suite.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(suite.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress bar for running tests */}
                {suite.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ความคืบหน้า</span>
                      <span>{Math.round(suite.progress)}%</span>
                    </div>
                    <Progress value={suite.progress} className="h-2" />
                  </div>
                )}

                {/* Test Results Summary */}
                {suite.status !== 'idle' && suite.status !== 'running' && (
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{passedTests} ผ่าน</span>
                    </span>
                    {failedTests > 0 && (
                      <span className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span>{failedTests} ไม่ผ่าน</span>
                      </span>
                    )}
                    {suite.lastRun && (
                      <span className="text-muted-foreground">
                        ทดสอบล่าสุด: {new Date(suite.lastRun).toLocaleString('th-TH')}
                      </span>
                    )}
                  </div>
                )}

                {/* Individual Tests */}
                <div className="space-y-2">
                  {suite.tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-2 rounded border-l-4 border-l-transparent hover:border-l-primary/20 hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(test.status)}
                        <span className="text-sm">{test.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {test.duration && (
                          <span className="text-xs text-muted-foreground">
                            {test.duration}ms
                          </span>
                        )}
                        {test.error && (
                          <div title={test.error}>
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Run Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => runTestSuite(suite.id)}
                  disabled={isRunning}
                  className="w-full"
                >
                  {suite.status === 'running' ? 'กำลังทดสอบ...' : 'เริ่มทดสอบชุดนี้'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SystemTestDashboard;