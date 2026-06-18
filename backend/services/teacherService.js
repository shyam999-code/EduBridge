const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const teacherService = {
  createTeacher: async (teacherData) => {
    const bcrypt = require('bcryptjs');

    function formatDateToDDMMYYYY(dob) {
      if (!dob) return '01012000';
      const d = new Date(dob);
      if (isNaN(d.getTime())) return '01012000';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}${month}${year}`;
    }

    const dobStr = formatDateToDDMMYYYY(teacherData.date_of_birth);
    const hashedPassword = await bcrypt.hash(dobStr, 10);
    const emailStr = teacherData.email || `${(teacherData.teacher_id || 'teacher').toLowerCase()}@edubridge.com`;

    if (!isConfigured) {
      const userId = `usr-${Math.random().toString(36).substr(2, 9)}`;
      mockDb.users.push({
        id: userId,
        name: teacherData.name || 'New Teacher',
        email: emailStr,
        role: 'teacher',
        status: 'active',
        password_hash: hashedPassword
      });

      const newTeacher = {
        id: `tch-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        teacher_id: teacherData.teacher_id,
        date_of_birth: teacherData.date_of_birth,
        subject: teacherData.subject,
        phone: teacherData.phone,
        designation: 'Senior Faculty Tutor',
        address: '128 Birchwood Avenue, Riverdale',
        created_at: new Date()
      };
      mockDb.teachers.push(newTeacher);
      mockDb.saveToDisk();
      return newTeacher;
    }

    // Supabase mode: Create user first
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        name: teacherData.name || 'New Teacher',
        email: emailStr,
        role: 'teacher',
        status: 'active',
        password_hash: hashedPassword
      }])
      .select()
      .single();

    if (userError) throw userError;

    // Create teacher record
    const { data, error } = await supabase
      .from('teachers')
      .insert([{
        user_id: newUser.id,
        teacher_id: teacherData.teacher_id,
        date_of_birth: teacherData.date_of_birth,
        subject: teacherData.subject,
        phone: teacherData.phone,
        designation: 'Senior Faculty Tutor',
        address: '128 Birchwood Avenue, Riverdale'
      }])
      .select()
      .single();

    if (error) {
      // rollback
      await supabase.from('users').delete().eq('id', newUser.id);
      throw error;
    }

    return data;
  },

  updateTeacher: async (id, updateData) => {
    if (!isConfigured) {
      const index = mockDb.teachers.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Teacher not found');
      const teacher = mockDb.teachers[index];
      
      // Extract name from updateData so it doesn't pollute teacher record schema
      const { name, ...teacherFields } = updateData;
      mockDb.teachers[index] = { ...teacher, ...teacherFields };
      
      if (name) {
        const userIdx = mockDb.users.findIndex(u => u.id === teacher.user_id);
        if (userIdx !== -1) {
          mockDb.users[userIdx].name = name;
        }
      }
      mockDb.saveToDisk();
      return mockDb.teachers[index];
    }

    const { name, ...teacherFields } = updateData;
    
    // Update teachers table
    const { data, error } = await supabase
      .from('teachers')
      .update(teacherFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update users table name
    if (name && data.user_id) {
      await supabase
        .from('users')
        .update({ name })
        .eq('id', data.user_id);
    }

    return data;
  },

  deleteTeacher: async (id) => {
    if (!isConfigured) {
      const index = mockDb.teachers.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Teacher not found');
      const teacher = mockDb.teachers[index];
      // Delete user
      const uIdx = mockDb.users.findIndex(u => u.id === teacher.user_id);
      if (uIdx !== -1) {
        mockDb.users.splice(uIdx, 1);
      }
      const deleted = mockDb.teachers.splice(index, 1);
      mockDb.saveToDisk();
      return deleted[0];
    }

    // Retrieve user_id
    const { data: teacher, error: fetchErr } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!teacher) throw new Error('Teacher not found');

    // Delete associated user, cascading to teachers table
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', teacher.user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getTeacherProfile: async (id, requester) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isRequesterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requester.id);

    if (!isConfigured) {
      const ensureFallbackTeacher = (userId) => {
        let teacher = mockDb.teachers.find(t => t.id === userId || t.user_id === userId);
        if (!teacher) {
          teacher = {
            id: `tch-${userId.replace(/[^a-z0-9]/g, '') || 'newteacher'}`,
            user_id: userId,
            designation: 'Senior Faculty Tutor',
            address: '128 Birchwood Avenue, Riverdale',
            phone: '+1 (555) 014-9821'
          };
          mockDb.teachers.push(teacher);
        }
      };

      ensureFallbackTeacher(id);
      if (requester && requester.role === 'teacher') {
        ensureFallbackTeacher(requester.id);
      }
    }

    if (requester.role === 'teacher') {
      const selfTeacher = (isConfigured && isRequesterUuid)
        ? await getTeacherByUserId(requester.id)
        : mockDb.teachers.find(t => t.user_id === requester.id);
      if (!selfTeacher || (selfTeacher.id !== id && selfTeacher.user_id !== id)) {
        throw { status: 403, code: 'FORBIDDEN', message: 'You can only retrieve your own teacher profile.' };
      }
    }

    if (!isConfigured || !isUuid) {
      let teacher = mockDb.teachers.find(t => t.id === id || t.user_id === id);
      let user = mockDb.users.find(u => u.id === teacher.user_id);
      if (!user) {
        user = {
          id: teacher.user_id,
          name: teacher.user_id.split('-').pop().toUpperCase(),
          email: teacher.user_id.includes('@') ? teacher.user_id : `${teacher.user_id.split('-').pop()}@edubridge.com`,
          role: 'teacher',
          status: 'active'
        };
        mockDb.users.push(user);
      }

      return {
        ...teacher,
        user: user || null
      };
    }

    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        user:users(*)
      `)
      .or(`id.eq.${id},user_id.eq.${id}`)
      .single();

    if (error) throw error;
    return data;
  },

  updateSelfProfile: async (userId, updateData) => {
    if (!isConfigured) {
      const teacher = mockDb.teachers.find(t => t.user_id === userId);
      if (!teacher) throw new Error('Teacher record not found');
      
      const allowedFields = ['subject', 'phone', 'address', 'designation'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          teacher[field] = updateData[field];
        }
      });
      mockDb.saveToDisk();
      return teacher;
    }

    const { data: teacher, error: fetchErr } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (fetchErr) throw fetchErr;

    const updateFields = { ...updateData };
    if (!('subject' in teacher)) {
      delete updateFields.subject;
    }

    if (Object.keys(updateFields).length === 0) {
      return teacher;
    }

    const { data, error } = await supabase
      .from('teachers')
      .update(updateFields)
      .eq('id', teacher.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  listTeachers: async () => {
    if (!isConfigured) {
      return mockDb.teachers.map(teacher => {
        const user = mockDb.users.find(u => u.id === teacher.user_id);
        return {
          ...teacher,
          name: user ? user.name : 'Unknown Teacher',
          email: user ? user.email : ''
        };
      });
    }

    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        user:users(name, email)
      `);

    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      name: t.user?.name || 'Unknown Teacher',
      email: t.user?.email || ''
    }));
  }
};

async function getTeacherByUserId(userId) {
  const { data } = await supabase.from('teachers').select('*').eq('user_id', userId).single();
  return data;
}

module.exports = teacherService;
