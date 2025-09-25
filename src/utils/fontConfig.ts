/**
 * Professional Thai & English Font Configuration
 * Following UX/UI guidelines for GACP platform
 */

export const fontConfig = {
  // Thai fonts
  thai: {
    primary: 'TH Sarabun New, Sarabun, sans-serif',
    heading: 'TH Chakra Petch, sans-serif',
    fallback: 'Noto Sans Thai, sans-serif'
  },
  
  // English fonts  
  english: {
    primary: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
    fallback: 'Arial, sans-serif'
  },
  
  // Mixed content (recommended)
  mixed: {
    primary: 'TH Sarabun New, Inter, system-ui, sans-serif',
    heading: 'TH Chakra Petch, Inter, system-ui, sans-serif'
  }
};

// Google Fonts URLs
export const googleFontsUrls = [
  'https://fonts.googleapis.com/css2?family=TH+Sarabun+New:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=TH+Chakra+Petch:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap'
];

// Function to inject fonts into document head
export const loadGoogleFonts = () => {
  googleFontsUrls.forEach(url => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  });
};