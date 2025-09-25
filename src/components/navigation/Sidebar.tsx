import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Calendar, 
  Award, 
  Users, 
  Settings, 
  BarChart3,
  Shield,
  Video,
  MapPin,
  Eye,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const getNavigation = (t: any) => ({
  applicant: [
    { name: t('menu.dashboard'), href: '/applicant/dashboard', icon: LayoutDashboard },
    { name: t('menu.applications'), href: '/applicant/applications', icon: FileText },
    { name: t('menu.payments'), href: '/applicant/payments', icon: CreditCard },
    { name: t('menu.schedule'), href: '/applicant/schedule', icon: Calendar },
    { name: t('menu.certificates'), href: '/applicant/certificates', icon: Award },
    { name: t('menu.settings'), href: '/applicant/settings', icon: Settings },
  ],
  reviewer: [
    { name: t('menu.dashboard'), href: '/reviewer/dashboard', icon: LayoutDashboard },
    { name: t('menu.queue'), href: '/reviewer/queue', icon: FileText },
  ],
  auditor: [
    { name: t('menu.dashboard'), href: '/auditor/dashboard', icon: LayoutDashboard },
    { name: t('menu.assessments'), href: '/auditor/assessments', icon: FileText },
    { name: t('menu.calendar'), href: '/auditor/calendar', icon: Calendar },
  ],
  admin: [
    { name: t('menu.dashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('menu.products'), href: '/admin/products', icon: Award },
    { name: t('menu.analytics'), href: '/admin/analytics', icon: BarChart3 },
    { name: t('menu.users'), href: '/admin/users', icon: Users },
    { name: t('menu.allApplications'), href: '/admin/applications', icon: FileText },
    { name: t('menu.certificateManagement'), href: '/admin/certificates', icon: Award },
    { name: t('menu.settings'), href: '/admin/settings', icon: Settings },
  ],
});

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation('navigation');
  const location = useLocation();

  const userRole = user?.profile?.role || 'applicant';
  const navigation = getNavigation(t);
  const userNavigation = navigation[userRole] || navigation.applicant;

  const handleSignOut = async () => {
    await signOut();
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">{t('systemTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('systemSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="space-y-1">
          <p className="text-sm font-medium">{user?.profile?.full_name}</p>
          <p className="text-xs text-muted-foreground">{user?.profile?.email}</p>
          <div className="inline-block">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              {t(`roles.${userRole}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {userNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
        
        {/* Module Access */}
        <div className="mt-6 pt-4 border-t">
          <NavLink
            to={`/${userRole}/modules`}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-2',
              location.pathname.includes('/modules')
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="w-4 h-4" />
            โมดูลทั้งหมด
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-3 bg-background hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {t('logout.button', { ns: 'auth' }) || 'ออกจากระบบ'}
        </Button>
      </div>
    </div>
  );
};