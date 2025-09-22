import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, FileCheck, Shield } from "lucide-react";

interface HeaderProps {
  isLoggedIn?: boolean;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
}

export const Header = ({ isLoggedIn = false, userRole, userName, onLogout }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "หน้าแรก", href: "/" },
    { name: "เกี่ยวกับ GACP", href: "/about" },
    { name: "SOP & กฎระเบียบ", href: "/regulations" },
    { name: "คำถามที่พบบ่อย", href: "/faq" },
    { name: "ติดต่อเรา", href: "/contact" },
  ];

  const roleNavigation = {
    applicant: [
      { name: "แดชบอร์ด", href: "/applicant/dashboard" },
      { name: "ความรู้และทดสอบ", href: "/applicant/knowledge" },
      { name: "คำขอ", href: "/applicant/applications" },
      { name: "การชำระเงิน", href: "/applicant/payments" },
      { name: "การประเมิน", href: "/applicant/assessment" },
      { name: "ใบรับรอง", href: "/applicant/certificate" },
    ],
    reviewer: [
      { name: "แดชบอร์ด", href: "/reviewer/dashboard" },
      { name: "คิวงาน", href: "/reviewer/queue" },
      { name: "คำขอ", href: "/reviewer/applications" },
      { name: "การนัดหมาย", href: "/reviewer/scheduling" },
    ],
    auditor: [
      { name: "แดชบอร์ด", href: "/auditor/dashboard" },
      { name: "ประเมินออนไลน์", href: "/auditor/online" },
      { name: "ประเมินลงพื้นที่", href: "/auditor/onsite" },
      { name: "รายงาน", href: "/auditor/reports" },
    ],
    admin: [
      { name: "แดชบอร์ด", href: "/admin/dashboard" },
      { name: "จัดการผู้ใช้", href: "/admin/users" },
      { name: "เทมเพลต SOP", href: "/admin/sop" },
      { name: "ตั้งค่าระบบ", href: "/admin/settings" },
      { name: "ใบรับรอง", href: "/admin/certificates" },
      { name: "บันทึกการใช้งาน", href: "/admin/logs" },
    ],
  };

  const currentNav = isLoggedIn && userRole ? roleNavigation[userRole as keyof typeof roleNavigation] : navigation;

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-smooth">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg shadow-soft">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">GACP</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Certification Platform</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {currentNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-smooth hover:text-primary ${
                  isActive(item.href)
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-foreground">{userName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  ออกจากระบบ
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/register">สมัครสมาชิก</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-primary transition-smooth"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur animate-fade-in">
            <nav className="px-4 py-4 space-y-3">
              {currentNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-2 text-sm font-medium transition-smooth ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {!isLoggedIn && (
                <div className="pt-3 border-t space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      เข้าสู่ระบบ
                    </Link>
                  </Button>
                  <Button variant="hero" size="sm" className="w-full" asChild>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      สมัครสมาชิก
                    </Link>
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