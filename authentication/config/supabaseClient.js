const { createClient } = require('@supabase/supabase-js');
const authConfig = require('./authConfig');

const url = authConfig.supabaseUrl;
const anonKey = authConfig.supabaseAnonKey;

const credentialsPresent = url && anonKey && !url.includes('your-project-id') && !url.includes('mockproject');

// Initialise the Supabase Client
const supabase = createClient(
  url || 'https://mockproject.supabase.co',
  anonKey || 'mock-anon-key-placeholder'
);

let _isConfigured = credentialsPresent;
let _verificationPromise = null;

const verifyConnection = async () => {
  if (!credentialsPresent) {
    console.warn('========================================================================');
    console.warn(' [WARNING]: Supabase database credentials are not fully configured yet!');
    console.warn(' Please update variables in your "authentication/.env" config file.');
    console.warn(' Falling back to local development mock database connectors...');
    console.warn('========================================================================');
    _isConfigured = false;
    return;
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection probe timeout after 5s')), 5000)
    );
    const probePromise = supabase.from('users').select('id').limit(5);
    const { data, error } = await Promise.race([probePromise, timeoutPromise]);

    if (error) {
      console.warn('========================================================================');
      console.warn(' [WARNING]: Supabase connection probe failed:', error.message);
      console.warn(' Falling back to local development mock database connectors...');
      console.warn('========================================================================');
      _isConfigured = false;
      return;
    }

    _isConfigured = true;
    console.log('=======================================================');
    console.log(' [INFO]: Supabase connection verified. Cloud DB is active.');
    console.log('=======================================================');
  } catch (e) {
    console.warn('========================================================================');
    console.warn(' [WARNING]: Supabase connection probe error:', e.message);
    console.warn(' Falling back to local development mock database connectors...');
    console.warn('========================================================================');
    _isConfigured = false;
  }
};

// Run verification immediately
_verificationPromise = verifyConnection();

module.exports = {
  supabase,
  get isConfigured() { return _isConfigured; },
  ready: _verificationPromise
};
