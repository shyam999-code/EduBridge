const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../config/supabaseClient');
const passwordHelper = require('../utils/passwordHelper');

// Local mock database fallback to support instant testing without configuration
const LOCAL_MOCK_DB = [
  {
    id: 'admin-uuid-1001',
    name: 'Shyamkumar',
    email: 'shyamkumar@edubridge.com',
    password_hash: '$2a$10$7bG6WUn9hM36BMEsYHdZ1u3TPm.UUy0..GpiFCtjyYSqUlpl.7yAK', // 'admin@123'
    role: 'admin',
    status: 'active'
  },
  {
    id: 'teacher-uuid-2002',
    name: 'Prof. Marcus Vance',
    email: 'teacher@edubridge.com',
    password_hash: '$2a$10$gbis77QUuhkJ1PEURwn/WOBOQoGuwHHgA62MVoDKnwYCSlH/EiRny', // 'password123'
    role: 'teacher',
    status: 'active'
  },
  {
    id: 'parent-uuid-3003',
    name: 'Robert Sterling',
    email: 'parent@edubridge.com',
    password_hash: '$2a$10$gbis77QUuhkJ1PEURwn/WOBOQoGuwHHgA62MVoDKnwYCSlH/EiRny', // 'password123'
    role: 'parent',
    status: 'active'
  },
  {
    id: 'student-uuid-4004',
    name: 'Leo Sterling',
    email: 'student@edubridge.com',
    password_hash: '$2a$10$gbis77QUuhkJ1PEURwn/WOBOQoGuwHHgA62MVoDKnwYCSlH/EiRny', // 'password123'
    role: 'student',
    status: 'active'
  }
];

const getMockUsers = () => {
  const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
  let users = [...LOCAL_MOCK_DB];
  if (fs.existsSync(mockDbPath)) {
    try {
      const raw = fs.readFileSync(mockDbPath, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.users)) {
        data.users.forEach(u => {
          const existing = users.find(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase());
          if (!existing) {
            users.push({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.status || 'active',
              password_hash: u.password_hash || '$2a$10$tMh3Pq/v7L/g2YIeqVqIeO67L4.qXqJ5Vz97iI5XJk2p7xV.5pLze' // default 'password123'
            });
          } else if (u.password_hash) {
            existing.password_hash = u.password_hash;
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse backend mockDb.json inside authService:', e);
    }
  }
  return users;
};

const studentIdRegex = /^(\d+)([a-zA-Z])(.+)$/;

function formatDateToDDMMYYYY(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${month}${year}`;
}

function matchClass(c, grade, section) {
  const nameClean = c.name.toLowerCase().replace(/\s+/g, '');
  const gradeLevelClean = c.grade_level.toLowerCase().replace(/\s+/g, '');
  const hasSection = nameClean.endsWith(section.toLowerCase()) || nameClean.includes(`-${section.toLowerCase()}`);
  const hasGrade = nameClean.includes(grade) || gradeLevelClean.includes(grade);
  return hasGrade && hasSection;
}

function matchRollNumber(sRoll, inputRoll) {
  const sClean = sRoll.toLowerCase().replace(/[^a-z0-9]/g, '');
  const inputClean = inputRoll.toLowerCase().replace(/[^a-z0-9]/g, '');
  return sClean === inputClean || sClean.endsWith(inputClean);
}

const getMockStudents = () => {
  const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
  let students = [];
  if (fs.existsSync(mockDbPath)) {
    try {
      const raw = fs.readFileSync(mockDbPath, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.students)) {
        students = data.students;
      }
    } catch (e) {
      console.error('Failed to parse backend mockDb.json inside getMockStudents:', e);
    }
  }
  return students;
};

const getMockClasses = () => {
  const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
  let classes = [];
  if (fs.existsSync(mockDbPath)) {
    try {
      const raw = fs.readFileSync(mockDbPath, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.classes)) {
        classes = data.classes;
      }
    } catch (e) {
      console.error('Failed to parse backend mockDb.json inside getMockClasses:', e);
    }
  }
  return classes;
};

/**
 * Authenticates user credentials.
 * @param {string} emailOrUserId - User email or unique identifier
 * @param {string} password - User plain text password
 */
const authenticateUser = async (emailOrUserId, password, role) => {
  if (role === 'parent') {
    let student = null;
    if (isConfigured) {
      try {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', emailOrUserId)
          .maybeSingle();
        student = data;
      } catch (err) {
        console.warn('Supabase student fetch error during parent authentication:', err);
      }
    }

    if (!student) {
      const studentsList = getMockStudents();
      student = studentsList.find(s => s.student_id && s.student_id.toLowerCase() === emailOrUserId.toLowerCase());
    }

    if (!student) {
      const error = new Error('No student profile registered with that Student ID.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const cleanNumber = (num) => (num || '').replace(/[^0-9]/g, '');
    const enteredPhone = cleanNumber(password);
    const storedPhone = cleanNumber(student.phone);

    if (!enteredPhone || !storedPhone || enteredPhone !== storedPhone) {
      const error = new Error('Invalid parent mobile number associated with this student.');
      error.statusCode = 401;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    let parent = null;
    let parentUser = null;

    if (isConfigured) {
      try {
        const { data } = await supabase
          .from('parents')
          .select('*, user:users(*)')
          .eq('child_id', student.id)
          .maybeSingle();
        parent = data;
        if (parent && parent.user) {
          parentUser = parent.user;
        }
      } catch (err) {
        console.warn('Supabase parent fetch error during parent authentication:', err);
      }
    }

    if (!parentUser) {
      const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
      let dbData = { parents: [], users: [] };
      if (fs.existsSync(mockDbPath)) {
        try {
          dbData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        } catch (e) {}
      }
      parent = (dbData.parents || []).find(p => p.child_id === student.id);
      if (parent) {
        const allUsers = getMockUsers();
        parentUser = allUsers.find(u => u.id === parent.user_id);
      }
    }

    if (!parentUser) {
      parentUser = {
        id: parent ? parent.user_id : `usr-parent-${student.id}`,
        name: student.parent_name || 'Parent',
        email: `${enteredPhone}@edubridge.com`,
        role: 'parent',
        status: 'active'
      };
    }

    return {
      id: parentUser.id,
      name: parentUser.name,
      email: parentUser.email,
      role: 'parent',
      status: parentUser.status || 'active'
    };
  }

  if (role === 'admin') {
    let reg = null;
    if (isConfigured) {
      try {
        const { data } = await supabase
          .from('admin_registrations')
          .select('*')
          .eq('email', emailOrUserId.toLowerCase().trim())
          .maybeSingle();
        reg = data;
      } catch (err) {
        console.warn('Supabase admin registration check error:', err);
      }
    }

    if (!reg) {
      const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
      if (fs.existsSync(mockDbPath)) {
        try {
          const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
          if (db && Array.isArray(db.admin_registrations)) {
            reg = db.admin_registrations.find(r => r.email.toLowerCase() === emailOrUserId.toLowerCase().trim());
          }
        } catch (e) {}
      }
    }

    if (reg) {
      if (reg.status === 'Pending') {
        const error = new Error('Registration Request Pending. Waiting for Super Admin Approval.');
        error.statusCode = 403;
        error.code = 'PENDING_APPROVAL';
        throw error;
      }
      if (reg.status === 'Rejected') {
        const error = new Error('Registration Request Rejected by Super Admin.');
        error.statusCode = 403;
        error.code = 'REJECTED_REGISTRATION';
        throw error;
      }
    }
  }

  let user = null;
  let useFallback = false;
  let teacherRecord = null;
  let studentRecord = null;

  if (isConfigured) {
    try {
      if (role === 'teacher') {
        const { data: teacher, error: tErr } = await supabase
          .from('teachers')
          .select('*, user:users(*)')
          .eq('teacher_id', emailOrUserId)
          .maybeSingle();
        if (teacher && teacher.user) {
          user = teacher.user;
          teacherRecord = teacher;
        }
      } else if (role === 'student') {
        const { data: student, error: sErr } = await supabase
          .from('students')
          .select('*, user:users(*)')
          .eq('student_id', emailOrUserId)
          .maybeSingle();
        if (student && student.user) {
          user = student.user;
          studentRecord = student;
        }
      } else if (role === 'parent') {
        const { data: parent, error: pErr } = await supabase
          .from('parents')
          .select('*, user:users(*)')
          .eq('phone', emailOrUserId)
          .maybeSingle();
        if (parent && parent.user) {
          user = parent.user;
        }
      }

      if (!user) {
        let emailLookup = emailOrUserId;
        if (!emailOrUserId.includes('@')) {
          if (emailOrUserId.toLowerCase() === 'admin') {
            emailLookup = 'shyamkumar@edubridge.com';
          } else {
            emailLookup = `${emailOrUserId}@edubridge.com`;
          }
        }
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailOrUserId);
        let query = supabase.from('users').select('*');
        if (isUuid) {
          query = query.or(`email.eq.${emailLookup},id.eq.${emailOrUserId}`);
        } else {
          query = query.eq('email', emailLookup);
        }
        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          user = data;
          
          if (role === 'teacher') {
            const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user.id).maybeSingle();
            if (t) teacherRecord = t;
          } else if (role === 'student') {
            const { data: s } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
            if (s) studentRecord = s;
          }
        }
      }
    } catch (err) {
      useFallback = true;
    }
  } else {
    useFallback = true;
  }

  if (useFallback || !user) {
    const allUsers = getMockUsers();
    
    // Look up based on mockDb lists specifically
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    let dbData = { teachers: [], students: [], parents: [] };
    if (fs.existsSync(mockDbPath)) {
      try {
        dbData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      } catch (e) {}
    }

    if (role === 'teacher' && Array.isArray(dbData.teachers)) {
      const teacher = dbData.teachers.find(t => t.teacher_id && t.teacher_id.toLowerCase() === emailOrUserId.toLowerCase());
      if (teacher) {
        user = allUsers.find(u => u.id === teacher.user_id);
        teacherRecord = teacher;
      }
    } else if (role === 'student' && Array.isArray(dbData.students)) {
      const student = dbData.students.find(s => s.student_id && s.student_id.toLowerCase() === emailOrUserId.toLowerCase());
      if (student) {
        user = allUsers.find(u => u.id === student.user_id);
        studentRecord = student;
      }
    } else if (role === 'parent' && Array.isArray(dbData.parents)) {
      const parent = dbData.parents.find(p => p.phone && p.phone === emailOrUserId);
      if (parent) {
        user = allUsers.find(u => u.id === parent.user_id);
      }
    }

    if (!user) {
      // Fallback standard lookup for demo compatibility
      user = allUsers.find(
        u => u.email.toLowerCase() === emailOrUserId.toLowerCase() || 
             u.id.toLowerCase() === emailOrUserId.toLowerCase() ||
             u.id.toLowerCase().replace('uuid-', '') === emailOrUserId.toLowerCase() ||
             u.email.split('@')[0].toLowerCase() === emailOrUserId.toLowerCase() ||
             u.role === emailOrUserId.toLowerCase()
      );
      if (user) {
        if (role === 'teacher' && Array.isArray(dbData.teachers)) {
          teacherRecord = dbData.teachers.find(t => t.user_id === user.id);
        } else if (role === 'student' && Array.isArray(dbData.students)) {
          studentRecord = dbData.students.find(s => s.user_id === user.id);
        }
      }
    }
  }

  if (!user) {
    const error = new Error('No user profile registered with those credentials.');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error(`Access suspended. This account status is currently: ${user.status}`);
    error.statusCode = 403;
    error.code = 'ACCOUNT_SUSPENDED';
    throw error;
  }

  let isMatch = false;
  const cleanPassword = password.replace(/[^0-9]/g, '');

  if (role === 'teacher' && teacherRecord && teacherRecord.date_of_birth) {
    const dobStr = formatDateToDDMMYYYY(teacherRecord.date_of_birth);
    if (dobStr && cleanPassword === dobStr) {
      isMatch = true;
    }
  } else if (role === 'student' && studentRecord && studentRecord.date_of_birth) {
    const dobStr = formatDateToDDMMYYYY(studentRecord.date_of_birth);
    if (dobStr && cleanPassword === dobStr) {
      isMatch = true;
    }
  }

  if (!isMatch) {
    isMatch = await passwordHelper.comparePassword(password, user.password_hash);
  }

  if (!isMatch) {
    const error = new Error('Invalid login credentials password.');
    error.statusCode = 401;
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
};

/**
 * Resolves user profile details.
 * @param {string} userId - Target unique identifier
 */
const getUserProfile = async (userId) => {
  let user = null;
  let useFallback = false;

  if (!isConfigured) {
    useFallback = true;
  } else {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (!isUuid) {
        useFallback = true;
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, status')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          useFallback = true;
        } else {
          user = data;
        }
      }
    } catch (err) {
      useFallback = true;
    }
  }

  if (useFallback) {
    const allUsers = getMockUsers();
    user = allUsers.find(u => u.id === userId);
  }

  if (!user) {
    const error = new Error('User profile record not found.');
    error.statusCode = 404;
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }

  return user;
};

const registerUser = async (emailOrUserId, password, role) => {
  const normalizedInput = emailOrUserId.toLowerCase();
  const email = emailOrUserId.includes('@') ? emailOrUserId : `${emailOrUserId}@edubridge.com`;

  let useFallback = false;
  let existingUser = null;

  if (isConfigured) {
    try {
      // Check if user exists in Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw error;
      }
      existingUser = data;

      if (existingUser) {
        const error = new Error('An account with these credentials already exists.');
        error.statusCode = 400;
        error.code = 'USER_ALREADY_EXISTS';
        throw error;
      }

      const name = emailOrUserId.split('@')[0].toUpperCase();
      const password_hash = await passwordHelper.hashPassword(password);

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          password_hash,
          role: role || 'student',
          status: 'active'
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Create role-specific profiles in Supabase
      if (role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert([{
            user_id: newUser.id,
            designation: 'Faculty Tutor',
            joining_date: new Date().toISOString().split('T')[0],
            address: '',
            phone: ''
          }]);
        if (teacherError) console.error('Failed to create teacher profile on register:', teacherError);
      } else if (role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{
            user_id: newUser.id,
            roll_number: `ET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            address: '',
            phone: ''
          }]);
        if (studentError) console.error('Failed to create student profile on register:', studentError);
      } else if (role === 'parent') {
        const { error: parentError } = await supabase
          .from('parents')
          .insert([{
            user_id: newUser.id,
            address: '',
            phone: ''
          }]);
        if (parentError) console.error('Failed to create parent profile on register:', parentError);
      }

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      };
    } catch (err) {
      if (err.code === 'USER_ALREADY_EXISTS' || err.statusCode === 400) {
        throw err;
      }
      console.warn('Supabase registration failed, falling back to mockDb:', err.message);
      useFallback = true;
    }
  } else {
    useFallback = true;
  }

  if (useFallback) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    let data = { users: [] };
    if (fs.existsSync(mockDbPath)) {
      try {
        const raw = fs.readFileSync(mockDbPath, 'utf8');
        data = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse backend mockDb.json inside registerUser:', e);
      }
    }

    if (!Array.isArray(data.users)) {
      data.users = [];
    }

    // Find if there is a matching user already in mockDb.json
    let existingUser = data.users.find(
      u => u.email.toLowerCase() === normalizedInput || 
           u.id.toLowerCase() === normalizedInput ||
           u.id.toLowerCase().replace('uuid-', '') === normalizedInput ||
           u.email.split('@')[0].toLowerCase() === normalizedInput
    );

    // If not found in mockDb.json, check if they exist in LOCAL_MOCK_DB
    if (!existingUser) {
      const inMock = LOCAL_MOCK_DB.find(
        u => u.email.toLowerCase() === normalizedInput || 
             u.id.toLowerCase() === normalizedInput ||
             u.id.toLowerCase().replace('uuid-', '') === normalizedInput ||
             u.email.split('@')[0].toLowerCase() === normalizedInput
      );
      if (inMock) {
        existingUser = { ...inMock };
      }
    }

    if (existingUser) {
      if (existingUser.password_hash) {
        const error = new Error('An account with these credentials already exists.');
        error.statusCode = 400;
        error.code = 'USER_ALREADY_EXISTS';
        throw error;
      }

      existingUser.password_hash = await passwordHelper.hashPassword(password);
      if (role && !existingUser.role) {
        existingUser.role = role;
      }

      const index = data.users.findIndex(u => u.id === existingUser.id);
      if (index !== -1) {
        data.users[index] = existingUser;
      } else {
        data.users.push(existingUser);
      }

      try {
        fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to update pre-created user in mockDb.json:', e);
      }

      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status || 'active'
      };
    }

    const newUser = {
      id: `uuid-${normalizedInput.replace(/[^a-z0-9]/g, '') || 'newuser'}`,
      name: emailOrUserId.split('@')[0].toUpperCase(),
      email: email,
      password_hash: await passwordHelper.hashPassword(password),
      role: role || 'student',
      status: 'active'
    };

    data.users.push(newUser);

    try {
      fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write new user to mockDb.json:', e);
    }

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status
    };
  }
};

const registerAdminRequest = async (fullName, schoolName, email, mobileNumber, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if exists in users
  let existingUser = null;
  if (isConfigured) {
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();
      existingUser = data;
    } catch (e) {}
  }
  if (!existingUser) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.users)) {
          existingUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
        }
      } catch (e) {}
    }
  }
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 400;
    error.code = 'USER_ALREADY_EXISTS';
    throw error;
  }

  // 2. Check if exists in admin_registrations
  let existingReg = null;
  if (isConfigured) {
    try {
      const { data } = await supabase
        .from('admin_registrations')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();
      existingReg = data;
    } catch (e) {}
  }
  if (!existingReg) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          existingReg = db.admin_registrations.find(r => r.email.toLowerCase() === normalizedEmail);
        }
      } catch (e) {}
    }
  }
  if (existingReg) {
    const error = new Error('A registration request with this email address already exists.');
    error.statusCode = 400;
    error.code = 'REGISTRATION_ALREADY_EXISTS';
    throw error;
  }

  // 3. Hash password
  const passwordHelper = require('../utils/passwordHelper');
  const hashedPassword = await passwordHelper.hashPassword(password);

  // 4. Save to DB
  let newReg = null;
  const createdAt = new Date().toISOString();
  let savedToSupabase = false;

  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_registrations')
        .insert([{
          full_name: fullName,
          school_name: schoolName,
          email: normalizedEmail,
          mobile_number: mobileNumber,
          password_hash: hashedPassword,
          status: 'Pending'
        }])
        .select()
        .single();
      if (error) throw error;
      newReg = data;
      savedToSupabase = true;
    } catch (e) {
      console.warn('⚠️ Supabase admin registration insert failed. Falling back to local mock database. DDL table public.admin_registrations might be missing.', e.message);
    }
  }

  if (!savedToSupabase) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    let db = { admin_registrations: [] };
    if (fs.existsSync(mockDbPath)) {
      try {
        db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      } catch (e) {}
    }
    if (!Array.isArray(db.admin_registrations)) {
      db.admin_registrations = [];
    }
    newReg = {
      id: `reg-${Math.random().toString(36).substr(2, 9)}`,
      full_name: fullName,
      school_name: schoolName,
      email: normalizedEmail,
      mobile_number: mobileNumber,
      password_hash: hashedPassword,
      status: 'Pending',
      created_at: createdAt
    };
    db.admin_registrations.push(newReg);
    fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2), 'utf8');

    // Sync in-memory mockDb
    try {
      const mockDb = require('../../backend/database/mockDb');
      if (mockDb) {
        if (!Array.isArray(mockDb.admin_registrations)) {
          mockDb.admin_registrations = [];
        }
        mockDb.admin_registrations.push(newReg);
      }
    } catch (e) {}
  }

  // 5. Send Email to Super Admin
  const emailService = require('../utils/emailService');
  const superAdminEmail = emailService.superAdminEmail;
  await emailService.sendEmail({
    to: superAdminEmail,
    subject: `[EduBridge] New School Admin Registration: ${schoolName}`,
    text: `
Hello Super Admin,

A new School Admin registration request has been submitted:

- Full Name: ${fullName}
- School Name: ${schoolName}
- Email Address: ${normalizedEmail}
- Mobile Number: ${mobileNumber}
- Registration Date & Time: ${new Date(createdAt).toLocaleString()}

To review this request, please log in to your EduBridge Admin dashboard, or use the direct approval links below:

Approve: http://localhost:5000/api/auth/admin-registrations/approve-direct?email=${encodeURIComponent(normalizedEmail)}
Reject: http://localhost:5000/api/auth/admin-registrations/reject-direct?email=${encodeURIComponent(normalizedEmail)}
`
  });

  return newReg;
};

const approveAdminRegistration = async (idOrEmail) => {
  let registration = null;
  let loadedFromSupabase = false;

  // 1. Find registration request
  if (isConfigured) {
    try {
      const query = supabase.from('admin_registrations').select('*');
      if (idOrEmail.includes('@')) {
        query.eq('email', idOrEmail.toLowerCase().trim());
      } else {
        query.eq('id', idOrEmail);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      registration = data;
      if (registration) loadedFromSupabase = true;
    } catch (e) {
      console.warn('Supabase admin registrations fetch failed, falling back to mockDb:', e.message);
    }
  }

  if (!registration) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          registration = db.admin_registrations.find(
            r => r.id === idOrEmail || r.email.toLowerCase() === idOrEmail.toLowerCase().trim()
          );
        }
      } catch (e) {}
    }
  }

  if (!registration) {
    const error = new Error('No registration request found with those details.');
    error.statusCode = 404;
    error.code = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  if (registration.status === 'Approved') {
    return registration;
  }

  // 2. Update status to Approved
  let updatedInSupabase = false;
  if (isConfigured && loadedFromSupabase) {
    try {
      const { error } = await supabase
        .from('admin_registrations')
        .update({ status: 'Approved' })
        .eq('id', registration.id);
      if (error) throw error;

      // Create user record in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          name: registration.full_name,
          email: registration.email,
          password_hash: registration.password_hash,
          role: 'admin',
          status: 'active'
        }, { onConflict: 'email' });
      if (userError) throw userError;
      updatedInSupabase = true;
    } catch (e) {
      console.warn('Supabase approve update failed, falling back to mockDb:', e.message);
    }
  }

  if (!updatedInSupabase) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          const r = db.admin_registrations.find(x => x.id === registration.id || x.email.toLowerCase() === registration.email.toLowerCase());
          if (r) {
            r.status = 'Approved';
          }
          if (!Array.isArray(db.users)) db.users = [];
          const uIdx = db.users.findIndex(u => u.email.toLowerCase() === registration.email.toLowerCase());
          const newAdminUser = {
            id: `usr-admin-${Math.random().toString(36).substr(2, 9)}`,
            name: registration.full_name,
            email: registration.email,
            password_hash: registration.password_hash,
            role: 'admin',
            status: 'active'
          };
          if (uIdx !== -1) {
            db.users[uIdx] = { ...db.users[uIdx], ...newAdminUser, id: db.users[uIdx].id };
          } else {
            db.users.push(newAdminUser);
          }
          fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2), 'utf8');

          // Sync in-memory mockDb
          const mockDb = require('../../backend/database/mockDb');
          if (mockDb) {
            const memoryReg = (mockDb.admin_registrations || []).find(x => x.id === registration.id || x.email.toLowerCase() === registration.email.toLowerCase());
            if (memoryReg) memoryReg.status = 'Approved';
            const memIdx = mockDb.users.findIndex(u => u.email.toLowerCase() === registration.email.toLowerCase());
            if (memIdx !== -1) {
              mockDb.users[memIdx] = { ...mockDb.users[memIdx], ...newAdminUser, id: mockDb.users[memIdx].id };
            } else {
              mockDb.users.push(newAdminUser);
            }
          }
        }
      } catch (e) {
        console.error('Failed to update mockDb on approve:', e);
      }
    }
  }

  // 3. Send approval email to applicant
  const emailService = require('../utils/emailService');
  await emailService.sendEmail({
    to: registration.email,
    subject: `[EduBridge] School Admin Registration Request Approved!`,
    text: `
Dear ${registration.full_name},

We are pleased to inform you that your School Admin registration request for "${registration.school_name}" has been APPROVED by the Super Admin.

You can now log in to the EduBridge ERP Console as an Administrator:

- Role: School Administrator (Admin)
- User ID: ${registration.email}
- Password: The password you registered with.

Log In URL: http://localhost:5173/login

Thank you,
EduBridge Admin Team
`
  });

  registration.status = 'Approved';
  return registration;
};

const rejectAdminRegistration = async (idOrEmail) => {
  let registration = null;
  let loadedFromSupabase = false;

  // 1. Find registration request
  if (isConfigured) {
    try {
      const query = supabase.from('admin_registrations').select('*');
      if (idOrEmail.includes('@')) {
        query.eq('email', idOrEmail.toLowerCase().trim());
      } else {
        query.eq('id', idOrEmail);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      registration = data;
      if (registration) loadedFromSupabase = true;
    } catch (e) {
      console.warn('Supabase admin registrations fetch failed during reject, falling back to mockDb:', e.message);
    }
  }

  if (!registration) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          registration = db.admin_registrations.find(
            r => r.id === idOrEmail || r.email.toLowerCase() === idOrEmail.toLowerCase().trim()
          );
        }
      } catch (e) {}
    }
  }

  if (!registration) {
    const error = new Error('No registration request found with those details.');
    error.statusCode = 404;
    error.code = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  if (registration.status === 'Rejected') {
    return registration;
  }

  // 2. Update status to Rejected
  let updatedInSupabase = false;
  if (isConfigured && loadedFromSupabase) {
    try {
      const { error } = await supabase
        .from('admin_registrations')
        .update({ status: 'Rejected' })
        .eq('id', registration.id);
      if (error) throw error;

      // Delete user from users table if exists to block login completely
      await supabase.from('users').delete().eq('email', registration.email);
      updatedInSupabase = true;
    } catch (e) {
      console.warn('Supabase reject update failed, falling back to mockDb:', e.message);
    }
  }

  if (!updatedInSupabase) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          const r = db.admin_registrations.find(x => x.id === registration.id || x.email.toLowerCase() === registration.email.toLowerCase());
          if (r) {
            r.status = 'Rejected';
          }
          if (db.users) {
            const uIdx = db.users.findIndex(u => u.email.toLowerCase() === registration.email.toLowerCase());
            if (uIdx !== -1) {
              db.users.splice(uIdx, 1);
            }
          }
          fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2), 'utf8');

          // Sync in-memory mockDb
          const mockDb = require('../../backend/database/mockDb');
          if (mockDb) {
            const memoryReg = (mockDb.admin_registrations || []).find(x => x.id === registration.id || x.email.toLowerCase() === registration.email.toLowerCase());
            if (memoryReg) memoryReg.status = 'Rejected';
            if (mockDb.users) {
              const memIdx = mockDb.users.findIndex(u => u.email.toLowerCase() === registration.email.toLowerCase());
              if (memIdx !== -1) {
                mockDb.users.splice(memIdx, 1);
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to update mockDb on reject:', e);
      }
    }
  }

  // 3. Send rejection email to applicant
  const emailService = require('../utils/emailService');
  await emailService.sendEmail({
    to: registration.email,
    subject: `[EduBridge] School Admin Registration Request Rejected`,
    text: `
Dear ${registration.full_name},

We regret to inform you that your School Admin registration request for "${registration.school_name}" has been REJECTED by the Super Admin.

If you believe this is in error or need further assistance, please contact the EduBridge Support Desk.

Thank you,
EduBridge Admin Team
`
  });

  registration.status = 'Rejected';
  return registration;
};

const listAdminRegistrations = async () => {
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch (e) {
      console.warn('Supabase admin registrations fetch failed, using mockDb fallback:', e.message);
    }
  }

  const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
  if (fs.existsSync(mockDbPath)) {
    try {
      const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      if (db && Array.isArray(db.admin_registrations)) {
        return db.admin_registrations;
      }
    } catch (e) {}
  }
  return [];
};

const removeAdminRegistration = async (id) => {
  let registration = null;
  let loadedFromSupabase = false;

  // 1. Find registration request
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_registrations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      registration = data;
      if (registration) loadedFromSupabase = true;
    } catch (e) {
      console.warn('Supabase admin registrations fetch failed during remove, using mockDb fallback:', e.message);
    }
  }

  if (!registration) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          registration = db.admin_registrations.find(r => r.id === id);
        }
      } catch (e) {}
    }
  }

  if (!registration) {
    const error = new Error('No registration request found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Delete from admin_registrations and users tables
  let deletedFromSupabase = false;
  if (isConfigured && loadedFromSupabase) {
    try {
      const { error } = await supabase
        .from('admin_registrations')
        .delete()
        .eq('id', id);
      if (error) throw error;

      await supabase.from('users').delete().eq('email', registration.email);
      deletedFromSupabase = true;
    } catch (e) {
      console.warn('Supabase delete registration failed, using mockDb fallback:', e.message);
    }
  }

  if (!deletedFromSupabase) {
    const mockDbPath = path.join(__dirname, '../../backend/database/mockDb.json');
    if (fs.existsSync(mockDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (db && Array.isArray(db.admin_registrations)) {
          db.admin_registrations = db.admin_registrations.filter(r => r.id !== id);
          if (db.users) {
            db.users = db.users.filter(u => u.email.toLowerCase() !== registration.email.toLowerCase());
          }
          fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2), 'utf8');

          // Sync memory mockDb
          const mockDb = require('../../backend/database/mockDb');
          if (mockDb) {
            mockDb.admin_registrations = (mockDb.admin_registrations || []).filter(r => r.id !== id);
            if (mockDb.users) {
              mockDb.users = mockDb.users.filter(u => u.email.toLowerCase() !== registration.email.toLowerCase());
            }
          }
        }
      } catch (e) {
        console.error('Failed to update mockDb on remove:', e);
      }
    }
  }

  return registration;
};

module.exports = {
  authenticateUser,
  getUserProfile,
  registerUser,
  registerAdminRequest,
  approveAdminRegistration,
  rejectAdminRegistration,
  listAdminRegistrations,
  removeAdminRegistration
};
