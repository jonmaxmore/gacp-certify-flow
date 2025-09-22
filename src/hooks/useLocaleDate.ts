import { useLanguage } from '@/providers/LanguageProvider';
import { formatDate, formatDateTime } from '@/utils/dateFormatter';

export const useLocaleDate = () => {
  const { language } = useLanguage();
  
  const formatDateLocale = (date: string | Date): string => {
    return formatDate(date, language);
  };
  
  const formatDateTimeLocale = (date: string | Date): string => {
    return formatDateTime(date, language);
  };
  
  return {
    formatDate: formatDateLocale,
    formatDateTime: formatDateTimeLocale,
    language,
  };
};