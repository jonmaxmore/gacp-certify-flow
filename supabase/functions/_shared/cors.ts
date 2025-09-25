// SECURITY FIX: Restrictive CORS configuration
const allowedOrigins = [
  'https://mpxebbqxqyzalctgsyxm.supabase.co',
  'https://24a232ca-9899-428e-a9ab-a4c88dd25128.lovableproject.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '', // Will be set dynamically
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

export const getCorsHeaders = (origin?: string | null) => {
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
  };
};