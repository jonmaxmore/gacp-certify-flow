import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, User, UserCheck, Shield, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
  full_name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  role: z.enum(["applicant", "reviewer", "auditor", "admin"]),
  thai_id_number: z.string().optional(),
  organization_name: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const roleConfig = {
  applicant: {
    title: "เกษตรกร / ผู้ประกอบการ",
    description: "สำหรับผู้ที่ต้องการขอใบรับรอง GACP",
    icon: User,
    color: "text-primary",
    bgColor: "bg-primary/10",
    requiresOrg: false
  },
  reviewer: {
    title: "เจ้าหน้าที่ตรวจสอบเอกสาร",
    description: "สำหรับการตรวจสอบและอนุมัติเอกสาร",
    icon: UserCheck,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    requiresOrg: true
  },
  auditor: {
    title: "เจ้าหน้าที่ตรวจประเมิน",
    description: "สำหรับการตรวจประเมินออนไลน์และลงพื้นที่",
    icon: Shield,
    color: "text-warning",
    bgColor: "bg-warning/10",
    requiresOrg: true
  },
  admin: {
    title: "ผู้ดูแลระบบ",
    description: "สำหรับการจัดการระบบและผู้ใช้งาน",
    icon: Settings,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    requiresOrg: true
  }
};

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "applicant",
    },
  });

  const selectedRole = form.watch("role");
  const config = roleConfig[selectedRole];

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    
    const userData = {
      full_name: data.full_name,
      role: data.role,
      thai_id_number: data.thai_id_number,
      organization_name: data.organization_name,
      position: data.position,
      phone: data.phone,
    };
    
    const result = await signUp(data.email, data.password, userData);
    
    if (!result.error) {
      // Redirect to appropriate dashboard or confirmation page
      navigate('/login?message=registration-success');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ย้อนกลับหน้าแรก
            </Link>
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              สมัครสมาชิก
            </h1>
            <p className="text-xl text-muted-foreground">
              สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบ GACP
            </p>
          </div>

          {/* Registration Form */}
          <Card className="shadow-medium border-0 bg-background">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">ข้อมูลการสมัครสมาชิก</CardTitle>
              <CardDescription>
                กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Role Selection */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ประเภทผู้ใช้งาน</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกประเภทผู้ใช้งาน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(roleConfig).map(([role, config]) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <config.icon className={`h-4 w-4 ${config.color}`} />
                                  {config.title}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role Description */}
                  <div className={`p-4 rounded-lg ${config.bgColor} border`}>
                    <div className="flex items-center gap-3 mb-2">
                      <config.icon className={`h-5 w-5 ${config.color}`} />
                      <h3 className="font-semibold">{config.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>อีเมล</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your@email.com" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Full Name */}
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อ-นามสกุล</FormLabel>
                          <FormControl>
                            <Input placeholder="ชื่อ นามสกุล" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>รหัสผ่าน</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" 
                              type="password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password */}
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ยืนยันรหัสผ่าน" 
                              type="password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เบอร์โทรศัพท์</FormLabel>
                          <FormControl>
                            <Input placeholder="08x-xxx-xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Thai ID (for applicants) */}
                    {selectedRole === 'applicant' && (
                      <FormField
                        control={form.control}
                        name="thai_id_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เลขประจำตัวประชาชน</FormLabel>
                            <FormControl>
                              <Input placeholder="x-xxxx-xxxxx-xx-x" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Organization fields for staff roles */}
                  {config.requiresOrg && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="organization_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>หน่วยงาน/องค์กร</FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อหน่วยงาน" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ตำแหน่ง</FormLabel>
                            <FormControl>
                              <Input placeholder="ตำแหน่งงาน" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="premium"
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      มีบัญชีอยู่แล้ว?{" "}
                      <Link 
                        to="/login" 
                        className="text-primary hover:underline transition-smooth"
                      >
                        เข้าสู่ระบบ
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}