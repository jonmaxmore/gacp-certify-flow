import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const FarmerLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setInfoMsg('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!loading && user && user.profile?.role === 'farmer') {
      navigate('/farmer/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">เข้าสู่ระบบเกษตรกร</CardTitle>
        </CardHeader>
        <CardContent>
          {infoMsg && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
              {infoMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'กำลังเข้าสู่ระบบ...' : <><LogIn className="h-4 w-4 mr-2" />เข้าสู่ระบบ</>}</Button>
          </form>
          <Separator className="my-6" />
          <div className="text-center text-sm">
            <span className="text-muted-foreground">ยังไม่มีบัญชี? </span>
            <a href="/register" className="text-primary hover:underline font-medium">สมัครสมาชิก</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerLoginPage;
