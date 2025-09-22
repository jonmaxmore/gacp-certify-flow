import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateInput, emailSchema, passwordSchema } from '@/utils/inputValidation';

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
  profile?: UserProfile;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking auth state change
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error getting initial session:', err);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setUser(authUser as AuthUser);
        return;
      }

      if (!profile) {
        // Create missing profile
        await createMissingProfile(authUser);
        return;
      }

      const userWithProfile: AuthUser = {
        ...authUser,
        profile: profile
      };

      setUser(userWithProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(authUser as AuthUser);
    }
  };

  const createMissingProfile = async (authUser: User) => {
    try {
      const profileData = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        role: (authUser.user_metadata?.role as 'applicant' | 'reviewer' | 'auditor' | 'admin') || 'applicant',
        phone: authUser.user_metadata?.phone || null,
        organization_name: authUser.user_metadata?.organization_name || null,
        thai_id_number: authUser.user_metadata?.thai_id_number || null,
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        setUser(authUser as AuthUser);
        return;
      }

      const userWithProfile: AuthUser = {
        ...authUser,
        profile: newProfile
      };

      setUser(userWithProfile);
      
      toast({
        title: "ยินดีต้อนรับ",
        description: "บัญชีของคุณได้รับการตั้งค่าเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error creating missing profile:', error);
      setUser(authUser as AuthUser);
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
      setLoading(true);
      
      // Validate and sanitize inputs
      const emailValidation = validateInput(email, 'email');
      if (!emailValidation.isValid) {
        throw new Error('Invalid email format: ' + emailValidation.errors.join(', '));
      }
      
      // Validate email with schema
      try {
        emailSchema.parse(emailValidation.sanitized);
      } catch (error: any) {
        throw new Error('Email validation failed: ' + error.errors?.[0]?.message || 'Invalid email');
      }
      
      // Validate password
      try {
        passwordSchema.parse(password);
      } catch (error: any) {
        throw new Error('Password validation failed: ' + error.errors?.[0]?.message || 'Invalid password');
      }
      
      // Sanitize other inputs
      const sanitizedData = {
        full_name: validateInput(userData.full_name).sanitized,
        role: userData.role,
        phone: userData.phone ? validateInput(userData.phone).sanitized : undefined,
        organization_name: userData.organization_name ? validateInput(userData.organization_name).sanitized : undefined,
        thai_id_number: userData.thai_id_number ? validateInput(userData.thai_id_number).sanitized : undefined,
      };
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.sanitized,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: sanitizedData
        }
      });

      if (error) throw error;

      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีของคุณ",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสมัครสมาชิกได้",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Validate and sanitize email input
      const emailValidation = validateInput(email, 'email');
      if (!emailValidation.isValid) {
        throw new Error('Invalid email format: ' + emailValidation.errors.join(', '));
      }
      
      try {
        emailSchema.parse(emailValidation.sanitized);
      } catch (error: any) {
        throw new Error('Email validation failed: ' + error.errors?.[0]?.message || 'Invalid email');
      }
      
      // Check rate limiting before attempting sign in
      const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
        identifier_val: emailValidation.sanitized,
        action_type_val: 'login_attempt',
        max_attempts: 5,
        window_minutes: 15
      });

      if (!rateLimitCheck) {
        toast({
          title: "พยายามเข้าสู่ระบบหลายครั้งเกินไป",
          description: "กรุณารอ 15 นาที ก่อนพยายามอีกครั้ง",
          variant: "destructive",
        });
        return { data: null, error: { message: "Rate limit exceeded" } };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitized,
        password,
      });

      if (error) {
        // Log authentication failure
        await supabase.rpc('log_auth_failure', {
          email_attempt: emailValidation.sanitized,
          failure_reason: error.message
        });
        throw error;
      }

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับ",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "ขอบคุณที่ใช้บริการ",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.profile?.id) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.profile.id)
        .select()
        .single();

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        profile: { ...prev.profile!, ...data }
      } : null);

      toast({
        title: "อัพเดทข้อมูลสำเร็จ",
        description: "ข้อมูลโปรไฟล์ได้รับการอัพเดทแล้ว",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัพเดทข้อมูลได้",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
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
};