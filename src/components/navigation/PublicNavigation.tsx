import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Menu, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PublicNavigation: React.FC = () => {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicMenuItems = [
    { key: 'home', label: 'หน้าแรก', path: '/' },
    { key: 'about', label: 'เกี่ยวกับเรา', path: '/about' },
    { key: 'news', label: 'ข่าวสาร', path: '/news' },
    { key: 'services', label: 'บริการออนไลน์', path: '/services' },
    { key: 'contact', label: 'ติดต่อเรา', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">{t('systemTitle')}</span>
              <span className="text-xs text-muted-foreground">{t('systemSubtitle')}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {publicMenuItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {/* Verify Certificate Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/verify-certificate')}
              className="hidden sm:inline-flex"
            >
              ตรวจสอบใบรับรอง
            </Button>

            {/* Login Button */}
            <Button
              onClick={() => navigate('/login')}
              size="sm"
            >
              เข้าสู่ระบบ
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-2 py-4">
              {publicMenuItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:bg-muted/50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/verify-certificate');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full mb-2"
                >
                  ตรวจสอบใบรับรอง
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};