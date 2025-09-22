export const formatDate = (date: string | Date, language: string = 'th'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'en') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Default to Thai
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
};

export const formatDateTime = (date: string | Date, language: string = 'th'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'en') {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Default to Thai
  return dateObj.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};