import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { LoginTestHelper } from '@/components/auth/LoginTestHelper';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    console.log('LoginPage useEffect - loading:', loading, 'user:', user);
    
    if (!loading && user) {
      console.log('User authenticated, redirecting to dashboard');
      // Handle users with profiles
      if (user.profile) {
        const role = user.profile.role;
        console.log('User role:', role);
        switch (role) {
          case 'applicant':
            navigate('/applicant/dashboard');
            break;
          case 'reviewer':
            navigate('/reviewer/dashboard');
            break;
          case 'auditor':
            navigate('/auditor/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/applicant/dashboard');
        }
      } else {
        console.log('User exists but no profile - redirecting to applicant dashboard');
        // User exists but no profile - redirect to applicant dashboard for now
        navigate('/applicant/dashboard');
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await signIn(email, password);
    
    if (data?.user && !error) {
      // Navigation will be handled by the useEffect above
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('login.loggingIn')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t('login.loginButton')}
                </div>
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t('login.noAccount')} </span>
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              {t('login.register')}
            </Link>
          </div>
        </CardContent>
        <LoginTestHelper />
      </Card>
    </div>
  );
};

export default LoginPage;