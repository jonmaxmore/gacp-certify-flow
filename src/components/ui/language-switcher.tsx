import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL?: boolean;
}

const languages: Language[] = [
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
];

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
  showLabel?: boolean;
}

export function LanguageSwitcher({ variant = 'dropdown', showLabel = true }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      
      // Apply RTL/LTR direction if needed
      const selectedLang = languages.find(lang => lang.code === languageCode);
      document.documentElement.dir = selectedLang?.isRTL ? 'rtl' : 'ltr';
      
      // Store in localStorage for persistence
      localStorage.setItem('preferred-language', languageCode);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'inline') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <h3 className="text-lg font-semibold">{t('languages.selectLanguage')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {languages.map((language) => (
                <Button
                  key={language.code}
                  variant={i18n.language === language.code ? 'default' : 'outline'}
                  className="justify-start h-auto p-4 space-x-3"
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <span className="text-xl">{language.flag}</span>
                  <div className="text-left flex-1">
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs opacity-70">{language.name}</div>
                  </div>
                  {i18n.language === language.code && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
            
            {/* Current selection indicator */}
            <div className="flex items-center justify-center pt-4 border-t">
              <Badge variant="secondary" className="flex items-center space-x-2">
                <span>{currentLanguage.flag}</span>
                <span>{t('languages.changeLanguage')}: {currentLanguage.nativeName}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 flex items-center space-x-2"
        >
          <Globe className="h-4 w-4" />
          <span className="text-lg">{currentLanguage.flag}</span>
          {showLabel && (
            <span className="hidden sm:inline-block text-sm">
              {currentLanguage.nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span>{t('languages.selectLanguage')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <span className="text-lg">{language.flag}</span>
            <div className="flex-1">
              <div className="font-medium">{language.nativeName}</div>
              <div className="text-xs text-muted-foreground">{language.name}</div>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;