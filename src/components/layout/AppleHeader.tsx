import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/apple-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Leaf,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppleHeaderProps {
  className?: string;
}

export function AppleHeader({ className }: AppleHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 glass-effect backdrop-blur-lg supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center space-x-2 transition-apple-smooth hover:opacity-80"
        >
          <div className="rounded-2xl bg-gradient-primary p-2 shadow-apple-soft">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold text-foreground">GACP</h1>
            <p className="text-xs text-muted-foreground">Certification Platform</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link 
            to="/about" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
          >
            About GACP
          </Link>
          <Link 
            to="/sop" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
          >
            SOPs
          </Link>
          <Link 
            to="/faq" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
          >
            FAQ
          </Link>
          <Link 
            to="/contact" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
          >
            Contact
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            /* User menu */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user.profile?.full_name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(user.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 rounded-2xl shadow-apple-medium"
                align="end"
                forceMount
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.profile?.full_name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials(user.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.profile?.full_name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.profile?.role || "applicant"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="rounded-xl text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Login/Register buttons */
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <Button 
                size="sm"
                asChild
              >
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 glass-effect">
          <nav className="container px-4 py-4 space-y-2">
            <Link 
              to="/about" 
              className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About GACP
            </Link>
            <Link 
              to="/sop" 
              className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              SOPs
            </Link>
            <Link 
              to="/faq" 
              className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link 
              to="/contact" 
              className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-apple-smooth rounded-xl hover:bg-accent/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {!user && (
              <div className="pt-2 border-t border-border/40 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-xl"
                  asChild
                >
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button 
                  className="w-full rounded-xl"
                  asChild
                >
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}