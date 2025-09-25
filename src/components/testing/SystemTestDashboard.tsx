import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Database,
  Users,
  Shield,
  Workflow
} from 'lucide-react';
import { SystemIntegrationTester, TestCase } from '@/utils/systemTesting';
import { useToast } from '@/hooks/use-toast';

export const SystemTestDashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<TestCase | null>(null);
  const [testResults, setTestResults] = useState<TestCase[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    passRate: 0
  });
  const { toast } = useToast();

  const runSystemTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);

    const tester = new SystemIntegrationTester((progressPercent, test) => {
      setProgress(progressPercent);
      setCurrentTest(test);
    });

    try {
      const results = await tester.runAllTests();
      setTestResults(results);
      
      const finalSummary = tester.getTestSummary();
      setSummary(finalSummary);

      toast({
        title: "ทดสอบระบบเสร็จสิ้น",
        description: `ผ่าน ${finalSummary.passed}/${finalSummary.total} เทส (${finalSummary.passRate.toFixed(1)}%)`,
        variant: finalSummary.passRate > 80 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('System test error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบระบบได้",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workflow':
        return <Workflow className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'integration':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryStats = (category: string) => {
    const categoryTests = testResults.filter(t => t.category === category);
    const passed = categoryTests.filter(t => t.status === 'passed').length;
    return {
      total: categoryTests.length,
      passed,
      rate: categoryTests.length > 0 ? (passed / categoryTests.length) * 100 : 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ระบบทดสอบการเชื่อมต่อ</h1>
          <p className="text-muted-foreground">
            ทดสอบการทำงานและการเชื่อมต่อของระบบทั้งหมด 200+ เทสเคส
          </p>
        </div>
        <Button 
          onClick={runSystemTests} 
          disabled={isRunning}
          size="lg"
          className="gap-2"
        >
          <Play className="h-5 w-5" />
          {isRunning ? 'กำลังทดสอบ...' : 'เริ่มทดสอบระบบ'}
        </Button>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">ความคืบหน้า</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentTest && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>กำลังทดสอบ: {currentTest.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">เทสทั้งหมด</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ผ่าน</p>
                  <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ไม่ผ่าน</p>
                  <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">อัตราผ่าน</p>
                  <p className="text-2xl font-bold">{summary.passRate.toFixed(1)}%</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Stats */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สถิติแยกตามประเภท</CardTitle>
            <CardDescription>ผลการทดสอบแยกตามประเภทการทำงาน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {['workflow', 'integration', 'ui', 'database', 'security'].map(category => {
                const stats = getCategoryStats(category);
                return (
                  <div key={category} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getCategoryIcon(category)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{category}</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.passed}/{stats.total} ({stats.rate.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ผลการทดสอบรายละเอียด</CardTitle>
            <CardDescription>รายการทดสอบทั้งหมดและผลลัพธ์</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {testResults.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getCategoryIcon(test.category)}
                        {test.category}
                      </Badge>
                      {test.duration && (
                        <span className="text-xs text-muted-foreground">
                          {test.duration.toFixed(0)}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Integration Issues Found */}
      {testResults.length > 0 && summary.failed > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700">ปัญหาที่พบในระบบ</CardTitle>
            <CardDescription>รายการปัญหาที่ต้องแก้ไขเพื่อให้ระบบทำงานสมบูรณ์</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults
                .filter(test => test.status === 'failed')
                .map((test) => (
                  <div key={test.id} className="p-3 border border-red-200 rounded-lg bg-white">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">{test.name}</h4>
                        <p className="text-sm text-red-700">{test.description}</p>
                        {test.error && (
                          <p className="text-xs text-red-600 mt-1 font-mono bg-red-100 p-2 rounded">
                            {test.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};