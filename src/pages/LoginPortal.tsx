import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, User, Shield, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserRole = "applicant" | "reviewer" | "auditor" | "admin";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPortal() {
  const [activeTab, setActiveTab] = useState<UserRole>("applicant");
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const roleConfig = {
    applicant: {
      title: "เกษตรกร / ผู้ประกอบการ",
      description: "สำหรับผู้ที่ต้องการขอใบรับรอง GACP",
      icon: User,
      redirectPath: "/applicant/dashboard",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    reviewer: {
      title: "เจ้าหน้าที่ตรวจสอบเอกสาร",
      description: "สำหรับการตรวจสอบและอนุมัติเอกสาร",
      icon: Shield,
      redirectPath: "/reviewer/dashboard", 
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    auditor: {
      title: "เจ้าหน้าที่ตรวจประเมิน",
      description: "สำหรับการตรวจประเมินออนไลน์และลงพื้นที่",
      icon: Eye,
      redirectPath: "/auditor/dashboard",
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    admin: {
      title: "ผู้ดูแลระบบ",
      description: "สำหรับการจัดการระบบและผู้ใช้งาน",
      icon: Settings,
      redirectPath: "/admin/dashboard",
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate login process
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: `ยินดีต้อนรับ ${loginForm.username}`,
      });
      
      // Redirect to appropriate dashboard
      navigate(roleConfig[activeTab].redirectPath);
    } catch (error) {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ย้อนกลับหน้าแรก
            </Link>
          </Button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              เข้าสู่ระบบ
            </h1>
            <p className="text-xl text-muted-foreground">
              เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ
            </p>
          </div>

          {/* Login Tabs */}
          <Card className="shadow-medium border-0 bg-background">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">เลือกประเภทผู้ใช้งาน</CardTitle>
              <CardDescription>
                กรุณาเลือกประเภทที่ตรงกับสิทธิ์การใช้งานของคุณ
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
                  {Object.entries(roleConfig).map(([role, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <TabsTrigger 
                        key={role} 
                        value={role}
                        className="flex flex-col items-center p-4 space-y-2 data-[state=active]:bg-background data-[state=active]:shadow-soft"
                      >
                        <div className={`p-3 rounded-full ${config.bgColor}`}>
                          <IconComponent className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-sm">{config.title}</div>
                          <div className="text-xs text-muted-foreground hidden sm:block mt-1">
                            {config.description}
                          </div>
                        </div>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {Object.entries(roleConfig).map(([role, config]) => (
                  <TabsContent key={role} value={role} className="mt-8">
                    <div className="max-w-md mx-auto">
                      <div className="text-center mb-6">
                        <div className={`inline-flex p-4 rounded-full ${config.bgColor} mb-4`}>
                          <config.icon className={`h-8 w-8 ${config.color}`} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
                        <p className="text-muted-foreground">{config.description}</p>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="กรอกชื่อผู้ใช้งาน"
                            value={loginForm.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                            className="shadow-soft"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">รหัสผ่าน</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="กรอกรหัสผ่าน"
                            value={loginForm.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            className="shadow-soft"
                            required
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          variant="premium"
                          disabled={isLoading}
                          size="lg"
                        >
                          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                        </Button>

                        <div className="text-center space-y-2">
                          <Link 
                            to="/forgot-password" 
                            className="text-sm text-primary hover:underline transition-smooth"
                          >
                            ลืมรหัสผ่าน?
                          </Link>
                          
                          {role === "applicant" && (
                            <div className="pt-4 border-t">
                              <p className="text-sm text-muted-foreground mb-3">
                                ยังไม่มีบัญชีผู้ใช้?
                              </p>
                              <Button variant="outline" size="sm" asChild className="w-full">
                                <Link to="/register">สมัครสมาชิกใหม่</Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </form>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <Card className="bg-primary/5 border-primary/20 shadow-soft">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">ต้องการความช่วยเหลือ?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  หากคุณมีปัญหาในการเข้าสู่ระบบหรือต้องการข้อมูลเพิ่มเติม
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/contact">ติดต่อสอบถาม</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/faq">คำถามที่พบบ่อย</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}