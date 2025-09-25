import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { LoginTestHelper } from '@/components/auth/LoginTestHelper'

const safeText = (val?: string, fallback?: string) => (val && !val.startsWith('login.')) ? val : (fallback || '')

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, user, loading } = useAuth()
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      const role = user.profile?.role
      if (role === 'reviewer') navigate('/reviewer/dashboard')
      else if (role === 'auditor') navigate('/auditor/dashboard')
      else if (role === 'admin') navigate('/admin/dashboard')
      else navigate('/applicant/dashboard')
    }
  }, [user, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    // Navigation handled by useEffect above
    if (error) {
      // Optional: show toast error here
    }
    setIsLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            {safeText(t('login.title'), 'เข้าสู่ระบบ')}
          </CardTitle>
          <CardDescription>
            {safeText(t('login.subtitle'), 'กรอกอีเมลและรหัสผ่านเพื่อเข้าระบบ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{safeText(t('login.email'), 'อีเมล')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={safeText(t('login.emailPlaceholder'), 'name@example.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{safeText(t('login.password'), 'รหัสผ่าน')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={safeText(t('login.passwordPlaceholder'), '••••••••')}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {safeText(t('login.loggingIn'), 'กำลังเข้าสู่ระบบ...')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {safeText(t('login.loginButton'), 'เข้าสู่ระบบ')}
                </div>
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {safeText(t('login.noAccount'), 'ยังไม่มีบัญชี?')}{' '}
            </span>
            <Link to="/register" className="text-primary hover:underline font-medium">
              {safeText(t('login.register'), 'สมัครใช้งาน')}
            </Link>
          </div>
        </CardContent>
        <LoginTestHelper />
      </Card>
    </div>
  )
}

export default LoginPage
