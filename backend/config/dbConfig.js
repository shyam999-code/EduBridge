const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or parent .env or fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../authentication/.env') });

module.exports = {
  port: process.env.PORT || 5001, // Use 5001 to avoid conflicting with auth service on 5000
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_edubridge_jwt_key_2026_academic_erp_system',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'edubridgeadmin1@gmail.com'
};
