import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/apple-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/apple-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Shield, 
  Search, 
  Settings, 
  ArrowLeft,
  Leaf,
  Eye,
  EyeOff,
  Lock,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "applicant" | "reviewer" | "auditor" | "admin";

interface LoginForm {
  email: string;
  password: string;
}

const roleConfig = {
  applicant: {
    title: "Applicant Portal",
    description: "For farmers and entrepreneurs applying for GACP certification",
    icon: User,
    redirect: "/applicant/dashboard",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  reviewer: {
    title: "Document Reviewer",
    description: "DTAM officers for document review and approval",
    icon: Shield,
    redirect: "/reviewer/dashboard",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  auditor: {
    title: "Field Auditor",
    description: "DTAM officers for on-site and online assessments",
    icon: Search,
    redirect: "/auditor/dashboard",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  admin: {
    title: "System Administrator",
    description: "Platform management and system oversight",
    icon: Settings,
    redirect: "/admin/dashboard",
    color: "text-warning",
    bgColor: "bg-warning/10"
  }
};

export default function LoginPortal() {
  const [activeTab, setActiveTab] = useState<UserRole>("applicant");
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "registered") {
      toast({
        title: "Registration Successful",
        description: "Welcome! Please sign in to continue.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (user && user.profile && !loading) {
      const redirectPath = roleConfig[user.profile.role as UserRole]?.redirect || "/";
      navigate(redirectPath);
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="rounded-2xl bg-gradient-primary p-2 shadow-apple-soft">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">GACP Portal</h1>
              <p className="text-xs text-muted-foreground">Certification Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-lg text-muted-foreground">
              Choose your role and sign in to continue
            </p>
          </div>

          {/* Login Form */}
          <Card className="overflow-hidden">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)}>
              <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/50 p-1">
                {Object.entries(roleConfig).map(([role, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <TabsTrigger
                      key={role}
                      value={role}
                      className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-apple-soft transition-apple-smooth"
                    >
                      <div className="flex flex-col items-center space-y-1 py-2">
                        <IconComponent className={cn("h-5 w-5", config.color)} />
                        <span className="text-xs font-medium hidden sm:block">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(roleConfig).map(([role, config]) => {
                const IconComponent = config.icon;
                return (
                  <TabsContent key={role} value={role} className="mt-6">
                    <CardHeader className="text-center space-y-4">
                      <div className={cn("w-16 h-16 rounded-2xl mx-auto flex items-center justify-center", config.bgColor)}>
                        <IconComponent className={cn("h-8 w-8", config.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{config.title}</CardTitle>
                        <CardDescription className="text-sm mt-2">
                          {config.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={loginForm.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className="pl-10 rounded-xl border-border/50 focus:border-primary"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginForm.password}
                              onChange={(e) => handleInputChange("password", e.target.value)}
                              className="pl-10 pr-10 rounded-xl border-border/50 focus:border-primary"
                              disabled={isLoading}
                              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleLogin}
                        disabled={isLoading}
                        size="lg"
                        className="w-full rounded-xl"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          "Sign In"
                        )}
                      </Button>

                      <div className="space-y-4">
                        <div className="text-center">
                          <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:text-primary/80 transition-apple-smooth"
                          >
                            Forgot your password?
                          </Link>
                        </div>

                        {role === "applicant" && (
                          <>
                            <Separator />
                            <div className="text-center space-y-2">
                              <p className="text-sm text-muted-foreground">
                                New to GACP certification?
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-xl"
                              >
                                <Link to="/register">Create Account</Link>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </TabsContent>
                );
              })}
            </Tabs>
          </Card>

          {/* Help Section */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Need Help?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-4 rounded-xl"
                  >
                    <Link to="/contact" className="flex flex-col space-y-2">
                      <div className="text-sm font-medium">Contact Support</div>
                      <div className="text-xs text-muted-foreground">
                        Get help with your account
                      </div>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-4 rounded-xl"
                  >
                    <Link to="/faq" className="flex flex-col space-y-2">
                      <div className="text-sm font-medium">FAQ</div>
                      <div className="text-xs text-muted-foreground">
                        Common questions answered
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}