const { createClient } = require('@supabase/supabase-js');
const dbConfig = require('./dbConfig');

const url = dbConfig.supabaseUrl;
const anonKey = dbConfig.supabaseAnonKey;

const credentialsPresent = url && anonKey && !url.includes('your-project-id') && !url.includes('mockproject');

// Initialise the Supabase Client
const supabase = createClient(
  url || 'https://mockproject.supabase.co',
  anonKey || 'mock-anon-key-placeholder'
);

// Runtime-verified flag. Verified async on startup.
let _isConfigured = credentialsPresent;
let _verificationPromise = null;

/**
 * UUID format regex for detecting real Supabase UUIDs vs mock IDs
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const autoSeedDefaultTestAccounts = async (supabase) => {
  try {
    console.log(' [INFO]: Running self-healing database seeding check for test accounts...');

    // 1. Admin Account shyamkumar@edubridge.com
    await supabase.from('users').upsert({
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Shyamkumar',
      email: 'shyamkumar@edubridge.com',
      password_hash: '$2a$10$7bG6WUn9hM36BMEsYHdZ1u3TPm.UUy0..GpiFCtjyYSqUlpl.7yAK',
      role: 'admin',
      status: 'active'
    }, { onConflict: 'email' });

    // 1b. Super Admin Account edubridgeadmin1@gmail.com
    await supabase.from('users').upsert({
      id: 'a2222222-2222-2222-2222-222222222222',
      name: 'Super Admin',
      email: 'edubridgeadmin1@gmail.com',
      password_hash: '$2a$10$7bG6WUn9hM36BMEsYHdZ1u3TPm.UUy0..GpiFCtjyYSqUlpl.7yAK', // password: admin@123
      role: 'admin',
      status: 'active'
    }, { onConflict: 'email' });

    // 2. Teacher User Account teacher@edubridge.com
    await supabase.from('users').upsert({
      id: 'b1111111-1111-1111-1111-111111111111',
      name: 'Prof. Marcus Vance',
      email: 'teacher@edubridge.com',
      password_hash: '$2b$10$IyG6atT5bvSJSZiQuS7WgeR56CB5hVfdXyMwpAvIHEQPoprv41SEG',
      role: 'teacher',
      status: 'active'
    }, { onConflict: 'email' });

    // 3. Student User Account student@edubridge.com
    await supabase.from('users').upsert({
      id: '01111111-1111-1111-1111-111111111111',
      name: 'Leo Sterling',
      email: 'student@edubridge.com',
      password_hash: '$2b$10$r571vzuQK8emiXVD7F5BH.tfpqvdRvHmweBfe2d26BI9iZGs/KeqS',
      role: 'student',
      status: 'active'
    }, { onConflict: 'email' });

    // 4. Parent User Account parent@edubridge.com
    await supabase.from('users').upsert({
      id: '02222222-2222-2222-2222-222222222222',
      name: 'Robert Sterling',
      email: 'parent@edubridge.com',
      password_hash: '$2b$10$3ekdhyEQ6V43MM.o8eTv8uExk7IslBn3x7zG2x4zNgq5ghY6CPamW',
      role: 'parent',
      status: 'active'
    }, { onConflict: 'email' });

    // 5. Teachers Profile
    const { data: existingTeacher } = await supabase.from('teachers').select('id').eq('user_id', 'b1111111-1111-1111-1111-111111111111').maybeSingle();
    if (existingTeacher) {
      await supabase.from('teachers').update({
        teacher_id: 'T001',
        date_of_birth: '1990-05-12',
        subject: 'Science',
        designation: 'Senior Mathematics & Physics Tutor',
        address: '128 Birchwood Avenue, Riverdale',
        phone: '+1 (555) 014-9821'
      }).eq('id', existingTeacher.id);
    } else {
      await supabase.from('teachers').insert({
        id: 'd1111111-1111-1111-1111-111111111111',
        user_id: 'b1111111-1111-1111-1111-111111111111',
        teacher_id: 'T001',
        date_of_birth: '1990-05-12',
        subject: 'Science',
        designation: 'Senior Mathematics & Physics Tutor',
        address: '128 Birchwood Avenue, Riverdale',
        phone: '+1 (555) 014-9821'
      });
    }

    // 6. Classes Level
    const { data: existingClass } = await supabase.from('classes').select('id').eq('id', 'c1111111-1111-1111-1111-111111111111').maybeSingle();
    if (!existingClass) {
      await supabase.from('classes').insert({
        id: 'c1111111-1111-1111-1111-111111111111',
        name: 'Grade 8-D',
        grade_level: 'Grade 8',
        teacher_id: existingTeacher ? existingTeacher.id : 'd1111111-1111-1111-1111-111111111111'
      });
    }

    // 7. Students Profile
    const { data: existingStudent } = await supabase.from('students').select('id').eq('user_id', '01111111-1111-1111-1111-111111111111').maybeSingle();
    if (existingStudent) {
      await supabase.from('students').update({
        student_id: '8D46',
        roll_number: '46',
        class_id: 'c1111111-1111-1111-1111-111111111111',
        address: '404 Oakwood Lane, Crestview',
        phone: '9988776655',
        date_of_birth: '2006-01-15'
      }).eq('id', existingStudent.id);
    } else {
      await supabase.from('students').insert({
        id: 'e1111111-1111-1111-1111-111111111111',
        user_id: '01111111-1111-1111-1111-111111111111',
        student_id: '8D46',
        roll_number: '46',
        class_id: 'c1111111-1111-1111-1111-111111111111',
        address: '404 Oakwood Lane, Crestview',
        phone: '9988776655',
        date_of_birth: '2006-01-15'
      });
    }

    // 8. Parents Profile
    const { data: existingParent } = await supabase.from('parents').select('id').eq('user_id', '02222222-2222-2222-2222-222222222222').maybeSingle();
    if (existingParent) {
      await supabase.from('parents').update({
        child_id: existingStudent ? existingStudent.id : 'e1111111-1111-1111-1111-111111111111',
        designation: 'Parent / Guardian',
        address: '404 Oakwood Lane, Crestview',
        phone: '9988776655'
      }).eq('id', existingParent.id);
    } else {
      await supabase.from('parents').insert({
        id: 'f1111111-1111-1111-1111-111111111111',
        user_id: '02222222-2222-2222-2222-222222222222',
        child_id: 'e1111111-1111-1111-1111-111111111111',
        designation: 'Parent / Guardian',
        address: '404 Oakwood Lane, Crestview',
        phone: '9988776655'
      });
    }

    console.log(' [SUCCESS]: Self-healing database seeding check complete.');
  } catch (err) {
    console.error(' [ERROR]: Self-healing database seeding check failed:', err.message);
  }
};

/**
 * Verifies the Supabase connection by querying a known table and checking
 * if real data (UUID-based users) exists in the database.
 */
const verifyConnection = async () => {
  if (!credentialsPresent) {
    console.warn('========================================================================');
    console.warn(' [WARNING]: Supabase database credentials are not fully configured yet!');
    console.warn(' Please update variables in your "backend/.env" config file.');
    console.warn(' Falling back to local development mock database connectors...');
    console.warn('========================================================================');
    _isConfigured = false;
    return;
  }

  try {
    // Probe: check if users table exists AND has UUID-based users (real Supabase data)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection probe timeout after 5s')), 5000)
    );
    const probePromise = supabase.from('users').select('id').limit(5);
    const { data, error } = await Promise.race([probePromise, timeoutPromise]);

    if (error) {
      console.warn('========================================================================');
      console.warn(' [WARNING]: Supabase connection probe failed:', error.message);
      console.warn(' The database tables may not exist or RLS is blocking the anon key.');
      console.warn(' Falling back to local development mock database connectors...');
      console.warn('========================================================================');
      _isConfigured = false;
      return;
    }

    // Check if the returned users have real UUID IDs (not mock IDs like 'admin-uuid-1001')
    const hasRealUuids = data && data.length > 0 && data.some(u => UUID_REGEX.test(u.id));

    if (!hasRealUuids) {
      console.warn('========================================================================');
      console.warn(' [WARNING]: Supabase users table exists but contains no UUID-based records.');
      console.warn(' The database appears to be empty or uses mock IDs.');
      console.warn(' Falling back to local development mock database connectors...');
      console.warn('========================================================================');
      _isConfigured = false;
    } else {
      _isConfigured = true;
      console.log('=======================================================');
      console.log(' [INFO]: Supabase connection verified. Cloud DB is active.');
      console.log('=======================================================');
      await autoSeedDefaultTestAccounts(supabase);
    }
  } catch (e) {
    console.warn('========================================================================');
    console.warn(' [WARNING]: Supabase connection probe error:', e.message);
    console.warn(' Falling back to local development mock database connectors...');
    console.warn('========================================================================');
    _isConfigured = false;
  }
};

// Run verification immediately and store the promise so we can await it if needed
_verificationPromise = verifyConnection();

module.exports = {
  supabase,
  get isConfigured() { return _isConfigured; },
  // Await this in startup to ensure verification completes before accepting requests
  ready: _verificationPromise
};
