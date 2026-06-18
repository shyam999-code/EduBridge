const { createClient } = require('@supabase/supabase-js');
const authConfig = require('./authConfig');

const url = authConfig.supabaseUrl;
const anonKey = authConfig.supabaseAnonKey;

if (!url || !anonKey || url.includes('your-project-id')) {
  console.warn('========================================================================');
  console.warn(' [WARNING]: Supabase database credentials are not fully configured yet!');
  console.warn(' Please update variables in your "authentication/.env" config file.');
  console.warn(' Falling back to local development mock database connectors...');
  console.warn('========================================================================');
}

// Initialise the Supabase Client
const supabase = createClient(
  url || 'https://mockproject.supabase.co',
  anonKey || 'mock-anon-key-placeholder'
);

const isConfigured = url && anonKey && !url.includes('your-project-id') && !url.includes('mockproject');

module.exports = {
  supabase,
  isConfigured
};
