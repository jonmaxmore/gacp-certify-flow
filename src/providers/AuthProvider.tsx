import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { validateInput, emailSchema, passwordSchema } from '@/utils/inputValidation'

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'applicant' | 'reviewer' | 'auditor' | 'admin';
  phone: string | null;
  organization_name: string | null;
  thai_id_number: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  profile?: UserProfile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    full_name: string;
    role: 'applicant' | 'reviewer' | 'auditor' | 'admin';
    phone?: string;
    organization_name?: string;
    thai_id_number?: string;
  }) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: any; error: any }>; 
  isRole: (role: 'applicant' | 'reviewer' | 'auditor' | 'admin') => boolean;
  hasRole: (roles: ('applicant' | 'reviewer' | 'auditor' | 'admin')[]) => boolean;
  profile: UserProfile | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let timedOut = false;

    // Safety timeout to prevent infinite loading on auth init
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        timedOut = true;
        setLoading(false);
        console.warn('Auth initialization timed out. Falling back to unauthenticated state.');
      }
    }, 8000);

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            await handleUser(initialSession.user);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setLoading(false);
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s || null);
      if (s?.user) {
        await handleUser(s.user);
      } else if (!timedOut) {
        setUser(null);
        setLoading(false);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleUser = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        setUser({ ...authUser, profile: null } as AuthUser);
        setLoading(false);
        return;
      }

      if (!profile) {
        // Create missing profile (basic)
        const profileData = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 'User',
          role: (authUser.user_metadata?.role as UserProfile['role']) || 'applicant',
          phone: authUser.user_metadata?.phone || null,
          organization_name: authUser.user_metadata?.organization_name || null,
          thai_id_number: authUser.user_metadata?.thai_id_number || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: newProfile, error: createErr } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (createErr) {
          console.error('Profile creation error:', createErr);
          setUser({ ...authUser, profile: null } as AuthUser);
          setLoading(false);
          return;
        }

        setUser({ ...authUser, profile: newProfile } as AuthUser);
        setLoading(false);
        toast({ title: 'ยินดีต้อนรับ', description: 'สร้างโปรไฟล์เรียบร้อยแล้ว' });
        return;
      }

      setUser({ ...authUser, profile } as AuthUser);
      setLoading(false);
    } catch (error) {
      console.error('Handle user error:', error);
      setUser({ ...authUser, profile: null } as AuthUser);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    full_name: string;
    role: 'applicant' | 'reviewer' | 'auditor' | 'admin';
    phone?: string;
    organization_name?: string;
    thai_id_number?: string;
  }) => {
    try {
      // Validate inputs (kept as-is)
      const emailValidation = validateInput(email, 'email');
      emailSchema.parse(emailValidation.sanitized);
      passwordSchema.parse(password);

      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.sanitized,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const emailValidation = validateInput(email, 'email');
      emailSchema.parse(emailValidation.sanitized);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitized,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes('session_not_found')) {
        throw error;
      }
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      setUser(null);
      setSession(null);
      return { error: null };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.profile?.id) {
      throw new Error('No user logged in');
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.profile.id)
        .select()
        .single();
      if (error) throw error;
      setUser(prev => prev ? { ...prev, profile: { ...prev.profile!, ...data } } : null);
      return { data, error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const isRole = (role: 'applicant' | 'reviewer' | 'auditor' | 'admin') => {
    return user?.profile?.role === role;
  };

  const hasRole = (roles: ('applicant' | 'reviewer' | 'auditor' | 'admin')[]) => {
    return user?.profile?.role ? roles.includes(user.profile.role) : false;
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isRole,
    hasRole,
    profile: user?.profile || null,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}