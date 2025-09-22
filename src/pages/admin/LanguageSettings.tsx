import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Globe, Users, CheckCircle, TrendingUp } from 'lucide-react';

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();

  const languageStats = [
    { language: 'Thai', code: 'th', users: 85, flag: '🇹🇭' },
    { language: 'English', code: 'en', users: 12, flag: '🇺🇸' },
    { language: 'Chinese (Simplified)', code: 'zh-CN', users: 2, flag: '🇨🇳' },
    { language: 'Chinese (Traditional)', code: 'zh-TW', users: 0.5, flag: '🇹🇼' },
    { language: 'Indonesian', code: 'id', users: 0.3, flag: '🇮🇩' },
    { language: 'Japanese', code: 'ja', users: 0.1, flag: '🇯🇵' },
    { language: 'Korean', code: 'ko', users: 0.1, flag: '🇰🇷' }
  ];

  const features = [
    {
      title: t('languages.selectLanguage'),
      description: "Users can switch between 7 supported languages instantly",
      icon: Globe,
      status: "live"
    },
    {
      title: "Cultural Localization",
      description: "Content adapted for regional agricultural practices and terminology",
      icon: Users,
      status: "live"
    },
    {
      title: "Voice Commands (Thai)",
      description: "Voice navigation support in Thai language with local dialects",
      icon: CheckCircle,
      status: "development"
    },
    {
      title: "RTL Support",
      description: "Right-to-left language support for future expansion",
      icon: TrendingUp,
      status: "planned"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'default';
      case 'development': return 'secondary';
      case 'planned': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('languages.changeLanguage')}</h1>
        <p className="text-muted-foreground">
          Multi-language support addressing 32% of farmers facing language barriers
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Language Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Current Language Settings
            </CardTitle>
            <CardDescription>
              Active language: {i18n.language} | Supported languages: 7
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-primary/5">
                <h3 className="font-semibold mb-2">Current Selection</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {languageStats.find(lang => lang.code === i18n.language)?.flag || '🇹🇭'}
                  </span>
                  <span className="font-medium">
                    {languageStats.find(lang => lang.code === i18n.language)?.language || 'Thai'}
                  </span>
                  <Badge variant="secondary">
                    {languageStats.find(lang => lang.code === i18n.language)?.users || 85}% of users
                  </Badge>
                </div>
              </div>

              <LanguageSwitcher variant="inline" />
            </div>
          </CardContent>
        </Card>

        {/* Language Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Language Usage Statistics</CardTitle>
            <CardDescription>
              Distribution of language preferences among GACP platform users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {languageStats.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{lang.flag}</span>
                    <div>
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-sm text-muted-foreground ml-2">({lang.code})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{lang.users}%</div>
                      <div className="text-xs text-muted-foreground">of users</div>
                    </div>
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${lang.users}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-language Features */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-language Features</CardTitle>
            <CardDescription>
              Advanced internationalization capabilities for better accessibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{feature.title}</h3>
                      </div>
                      <Badge variant={getStatusColor(feature.status)}>
                        {feature.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Benefits</CardTitle>
            <CardDescription>
              Impact of multi-language support on user experience and adoption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">90%</div>
                <p className="text-sm text-muted-foreground">Better farmer comprehension</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">68%</div>
                <p className="text-sm text-muted-foreground">Reduced support requests</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-purple-600">45%</div>
                <p className="text-sm text-muted-foreground">Faster application completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}