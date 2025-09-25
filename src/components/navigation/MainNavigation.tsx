import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Menu, 
  X, 
  Home, 
  Info, 
  Newspaper, 
  Settings, 
  Phone,
  LogIn,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

const MainNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicMenuItems = [
    { path: '/', label: 'หน้าหลัก', icon: Home },
    { path: '/about', label: 'เกี่ยวกับเรา', icon: Info },
    { path: '/news', label: 'ข่าวสาร', icon: Newspaper },
    { path: '/verify-certificate', label: 'ตรวจสอบใบรับรอง', icon: ShieldCheck },
    { path: '/contact', label: 'ติดต่อ', icon: Phone },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!user?.profile?.role) return '/login';
    return `/${user.profile.role}/dashboard`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavigation('/')}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-heading font-bold text-foreground">GACP</h1>
              <p className="text-xs text-muted-foreground">Certification Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {publicMenuItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex items-center space-x-2 transition-colors",
                  isActive(item.path) 
                    ? "bg-primary text-white" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-thai">{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="hidden sm:flex">
                  {user?.profile?.full_name || user?.email}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleNavigation(getDashboardPath())}
                  className="font-thai"
                >
                  แดชบอร์ด
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('/login')}
                  className="flex items-center space-x-2 font-thai"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavigation('/register')}
                  className="flex items-center space-x-2 font-thai"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>สมัครสมาชิก</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-border/50">
            <nav className="flex flex-col space-y-2 mt-4">
              {publicMenuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "justify-start flex items-center space-x-3 w-full font-thai",
                    isActive(item.path) 
                      ? "bg-primary text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
              
              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => handleNavigation('/login')}
                    className="justify-start flex items-center space-x-3 w-full font-thai"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </Button>
                  <Button
                    onClick={() => handleNavigation('/register')}
                    className="justify-start flex items-center space-x-3 w-full font-thai"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>สมัครสมาชิก</span>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainNavigation;