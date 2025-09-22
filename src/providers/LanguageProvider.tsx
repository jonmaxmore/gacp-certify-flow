import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>('th');
  const [isChanging, setIsChanging] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      // First, try to get from user profile if authenticated
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .maybeSingle();
          
          if (data?.preferred_language && !error) {
            const savedLang = data.preferred_language as Language;
            setLanguage(savedLang);
            i18n.changeLanguage(savedLang);
            return;
          }
        } catch (error) {
          console.log('No user language preference found');
        }
      }

      // Fall back to localStorage
      const savedLanguage = localStorage.getItem('i18nextLng') as Language;
      if (savedLanguage && ['th', 'en'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }
    };

    loadLanguagePreference();
  }, [user, i18n]);

  const changeLanguage = async (lang: Language) => {
    setIsChanging(true);
    
    try {
      // Update i18n
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      
      // Save to localStorage
      localStorage.setItem('i18nextLng', lang);
      
      // Save to user profile if authenticated
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const value: LanguageContextType = {
    language,
    changeLanguage,
    isChanging,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};