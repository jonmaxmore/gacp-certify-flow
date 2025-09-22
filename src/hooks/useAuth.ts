import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'applicant' | 'reviewer' | 'auditor' | 'admin';
  thai_id_number: string | null;
  organization_name: string | null;
  position: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  profile?: UserProfile;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Auth hook initializing...');
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          console.log('User found, fetching profile...');
          // Use setTimeout to avoid blocking auth state change
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          console.log('No user found');
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        console.log('Initial session has user, fetching profile...');
        fetchUserProfile(session.user);
      } else {
        console.log('No initial session found');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('Fetching profile for user:', authUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setUser(authUser as AuthUser);
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log('No profile found, creating one...');
        await createMissingProfile(authUser);
        return;
      }

      console.log('Profile found:', profile);
      const userWithProfile: AuthUser = {
        ...authUser,
        profile: profile
      };

      setUser(userWithProfile);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(authUser as AuthUser);
      setLoading(false);
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
        thai_id_number: authUser.user_metadata?.thai_id_number || null,
        organization_name: authUser.user_metadata?.organization_name || null,
        position: authUser.user_metadata?.position || null,
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        setUser(authUser as AuthUser);
        setLoading(false);
        return;
      }

      const userWithProfile: AuthUser = {
        ...authUser,
        profile: newProfile
      };

      setUser(userWithProfile);
      setLoading(false);
      
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
    thai_id_number?: string;
    organization_name?: string;
    position?: string;
    phone?: string;
  }) => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.full_name,
            role: userData.role,
            thai_id_number: userData.thai_id_number,
            organization_name: userData.organization_name,
            position: userData.position,
            phone: userData.phone,
          }
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: `ยินดีต้อนรับ`,
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

  return {
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
    isAdmin: isRole('admin'),
    isApplicant: isRole('applicant'),
    isReviewer: isRole('reviewer'),
    isAuditor: isRole('auditor'),
  };
};