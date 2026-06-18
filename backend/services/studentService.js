const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');
const bcrypt = require('bcryptjs');

const studentService = {
  createStudent: async (studentData) => {
    function formatDateToDDMMYYYY(dob) {
      if (!dob) return '01012000';
      const d = new Date(dob);
      if (isNaN(d.getTime())) return '01012000';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}${month}${year}`;
    }

    const classNum = (studentData.class || '').toString().replace(/[^0-9]/g, '');
    const section = (studentData.section || '').toString().trim().toUpperCase();
    const rollNo = (studentData.roll_number || '').toString().trim();
    const generatedStudentId = `${classNum}${section}${rollNo}`;

    const dobStr = formatDateToDDMMYYYY(studentData.date_of_birth);
    const hashedPassword = await bcrypt.hash(dobStr, 10);
    const studentEmail = `${generatedStudentId.toLowerCase()}@edubridge.com`;

    if (!isConfigured) {
      // 1. Resolve Class
      let targetClass = mockDb.classes.find(c => c.name.toLowerCase().replace(/\s+/g, '') === `grade${classNum}-${section}`.toLowerCase());
      if (!targetClass) {
        targetClass = {
          id: `class-${classNum.toLowerCase()}${section.toLowerCase()}`,
          name: `Grade ${classNum}-${section}`,
          grade_level: `Grade ${classNum}`,
          teacher_id: 'd1111111-1111-1111-1111-111111111111'
        };
        mockDb.classes.push(targetClass);
      }
      const classId = targetClass.id;

      // 2. Create Student User
      const studentUserId = `usr-${Math.random().toString(36).substr(2, 9)}`;
      mockDb.users.push({
        id: studentUserId,
        name: studentData.name,
        email: studentEmail,
        role: 'student',
        status: 'active',
        password_hash: hashedPassword
      });

      // 3. Create Student
      const newStudent = {
        id: `std-${Math.random().toString(36).substr(2, 9)}`,
        user_id: studentUserId,
        student_id: generatedStudentId,
        roll_number: rollNo,
        class_id: classId,
        address: '404 Oakwood Lane, Crestview',
        phone: studentData.parent_phone || '',
        date_of_birth: studentData.date_of_birth,
        created_at: new Date(),
        status: 'Enrolled'
      };
      mockDb.students.push(newStudent);

      // 4. Create Parent User & Link Parent
      const parentUserId = `usr-${Math.random().toString(36).substr(2, 9)}`;
      const parentPhone = studentData.parent_phone || '9988776655';
      const hashedParentPassword = await bcrypt.hash(parentPhone, 10);
      mockDb.users.push({
        id: parentUserId,
        name: studentData.parent_name || 'Parent',
        email: `${parentPhone}@edubridge.com`,
        role: 'parent',
        status: 'active',
        password_hash: hashedParentPassword
      });

      const newParent = {
        id: `par-${Math.random().toString(36).substr(2, 9)}`,
        user_id: parentUserId,
        child_id: newStudent.id,
        designation: 'Parent / Guardian',
        address: '404 Oakwood Lane, Crestview',
        phone: parentPhone,
        created_at: new Date()
      };
      mockDb.parents.push(newParent);

      mockDb.saveToDisk();
      return newStudent;
    }

    // Supabase Mode
    // 1. Resolve Class
    const className = `Grade ${classNum}-${section}`;
    const gradeLevel = `Grade ${classNum}`;
    let classId = null;
    const { data: existingClass } = await supabase
      .from('classes')
      .select('*')
      .eq('name', className)
      .maybeSingle();

    if (existingClass) {
      classId = existingClass.id;
    } else {
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert([{
          name: className,
          grade_level: gradeLevel,
          teacher_id: 'd1111111-1111-1111-1111-111111111111'
        }])
        .select()
        .single();
      if (classError) {
        const { data: retryClass, error: retryErr } = await supabase
          .from('classes')
          .insert([{ name: className, grade_level: gradeLevel }])
          .select()
          .single();
        if (retryErr) throw retryErr;
        classId = retryClass.id;
      } else {
        classId = newClass.id;
      }
    }

    // 2. Create Student User
    const { data: newStudentUser, error: studentUserError } = await supabase
      .from('users')
      .insert([{
        name: studentData.name,
        email: studentEmail,
        role: 'student',
        status: 'active',
        password_hash: hashedPassword
      }])
      .select()
      .single();

    if (studentUserError) throw studentUserError;

    // 3. Create Student Link
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert([{
        user_id: newStudentUser.id,
        student_id: generatedStudentId,
        roll_number: rollNo,
        class_id: classId,
        address: '404 Oakwood Lane, Crestview',
        phone: studentData.parent_phone || '',
        date_of_birth: studentData.date_of_birth,
        status: 'Enrolled'
      }])
      .select()
      .single();

    if (studentError) {
      await supabase.from('users').delete().eq('id', newStudentUser.id);
      throw studentError;
    }

    // 4. Create Parent User & Link Parent
    try {
      const parentPhone = studentData.parent_phone || '9988776655';
      const hashedParentPassword = await bcrypt.hash(parentPhone, 10);
      
      const { data: newParentUser, error: parentUserError } = await supabase
        .from('users')
        .insert([{
          name: studentData.parent_name || 'Parent',
          email: `${parentPhone}@edubridge.com`,
          role: 'parent',
          status: 'active',
          password_hash: hashedParentPassword
        }])
        .select()
        .single();

      if (!parentUserError && newParentUser) {
        await supabase
          .from('parents')
          .insert([{
            user_id: newParentUser.id,
            child_id: newStudent.id,
            designation: 'Parent / Guardian',
            address: '404 Oakwood Lane, Crestview',
            phone: parentPhone
          }]);
      }
    } catch (parentErr) {
      console.error('Failed to auto-link parent during student creation:', parentErr);
    }

    return newStudent;
  },

  updateStudent: async (id, updateData) => {
    if (!isConfigured) {
      const index = mockDb.students.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Student not found');
      mockDb.students[index] = { ...mockDb.students[index], ...updateData };
      return mockDb.students[index];
    }

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteStudent: async (id) => {
    if (!isConfigured) {
      const index = mockDb.students.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Student not found');
      const student = mockDb.students[index];

      // Remove student user
      const uIdx = mockDb.users.findIndex(u => u.id === student.user_id);
      if (uIdx !== -1) mockDb.users.splice(uIdx, 1);

      // Remove linked parent profile and user
      const parentIndex = mockDb.parents.findIndex(p => p.child_id === student.id);
      if (parentIndex !== -1) {
        const parent = mockDb.parents[parentIndex];
        const pUserIdx = mockDb.users.findIndex(u => u.id === parent.user_id);
        if (pUserIdx !== -1) mockDb.users.splice(pUserIdx, 1);
        mockDb.parents.splice(parentIndex, 1);
      }

      const deleted = mockDb.students.splice(index, 1);
      mockDb.saveToDisk();
      return deleted[0];
    }

    // Retrieve student details first
    const { data: student, error: fetchErr } = await supabase
      .from('students')
      .select('user_id, id')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!student) throw new Error('Student not found');

    // Retrieve parent details
    const { data: parent } = await supabase
      .from('parents')
      .select('user_id')
      .eq('child_id', student.id)
      .maybeSingle();

    // Delete student user (cascades to students table)
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', student.user_id)
      .select()
      .single();

    if (error) throw error;

    // Delete parent user if parent exists (cascades to parents table)
    if (parent) {
      await supabase
        .from('users')
        .delete()
        .eq('id', parent.user_id);
    }

    return data;
  },

  getStudentProfile: async (id, requester) => {
    const verifyRequesterGating = (studentObj) => {
      if (!requester) return;
      if (requester.role === 'student') {
        if (studentObj.user_id !== requester.id && studentObj.id !== requester.id) {
          throw { status: 403, code: 'FORBIDDEN', message: 'You can only retrieve your own student profile.' };
        }
      }
    };

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            user:users(*),
            class:classes(*)
          `)
          .or(`id.eq.${id},user_id.eq.${id}`)
          .maybeSingle();

        if (!error && data) {
          if (requester && requester.role === 'parent') {
            const { data: parent } = await supabase
              .from('parents')
              .select('*')
              .eq('user_id', requester.id)
              .maybeSingle();
            if (!parent || (parent.child_id !== data.id && parent.child_id !== id)) {
              throw { status: 403, code: 'FORBIDDEN', message: 'You can only retrieve your linked child\'s student profile.' };
            }
          } else {
            verifyRequesterGating(data);
          }
          return data;
        }
      } catch (err) {
        if (err.status === 403) throw err;
        console.warn('Supabase fetch profile failed, using mockDb fallback:', err);
      }
    }

    // MockDb fallback path
    const ensureFallbackStudent = (userId) => {
      let student = mockDb.students.find(s => s.id === userId || s.user_id === userId);
      if (!student) {
        student = {
          id: `std-${userId.replace(/[^a-z0-9]/g, '') || 'newstudent'}`,
          user_id: userId,
          roll_number: `ET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          class_id: 'c1111111-1111-1111-1111-111111111111',
          address: '404 Oakwood Lane, Crestview',
          phone: '+1 (555) 012-7489'
        };
        mockDb.students.push(student);

        const baseStudentId = 'e1111111-1111-1111-1111-111111111111';
        const newStudentId = student.id;

        mockDb.attendance.forEach(att => {
          if (att.student_id === baseStudentId) {
            mockDb.attendance.push({
              ...att,
              id: `att-${Math.random().toString(36).substr(2, 9)}`,
              student_id: newStudentId
            });
          }
        });

        mockDb.marks.forEach(mark => {
          if (mark.student_id === baseStudentId) {
            mockDb.marks.push({
              ...mark,
              id: `mrk-${Math.random().toString(36).substr(2, 9)}`,
              student_id: newStudentId
            });
          }
        });

        mockDb.behaviour_reports.forEach(beh => {
          if (beh.student_id === baseStudentId) {
            mockDb.behaviour_reports.push({
              ...beh,
              id: `beh-${Math.random().toString(36).substr(2, 9)}`,
              student_id: newStudentId
            });
          }
        });
      }
    };

    ensureFallbackStudent(id);
    if (requester && requester.role === 'student') {
      ensureFallbackStudent(requester.id);
    }

    if (requester && requester.role === 'parent') {
      const parentProf = mockDb.parents.find(p => p.user_id === requester.id);
      if (!parentProf || (parentProf.child_id !== id && parentProf.user_id !== id)) {
        throw { status: 403, code: 'FORBIDDEN', message: 'You can only retrieve your linked child\'s student profile.' };
      }
    } else if (requester) {
      const targetStudent = mockDb.students.find(s => s.id === id || s.user_id === id);
      if (targetStudent) verifyRequesterGating(targetStudent);
    }

    let student = mockDb.students.find(s => s.id === id || s.user_id === id);
    let user = mockDb.users.find(u => u.id === student.user_id);
    if (!user) {
      user = {
        id: student.user_id,
        name: student.user_id.split('-').pop().toUpperCase(),
        email: student.user_id.includes('@') ? student.user_id : `${student.user_id.split('-').pop()}@edubridge.com`,
        role: 'student',
        status: 'active'
      };
      mockDb.users.push(user);
    }

    const classObj = mockDb.classes.find(c => c.id === student.class_id);
    return {
      ...student,
      user: user || null,
      class: classObj || null
    };
  },

  listStudents: async (searchQuery = '') => {
    let mockStudents = mockDb.students.map(student => {
      const user = mockDb.users.find(u => u.id === student.user_id);
      const classObj = mockDb.classes.find(c => c.id === student.class_id);
      return {
        ...student,
        name: user ? user.name : (student.name || 'Unknown Student'),
        email: user ? user.email : '',
        class_name: classObj ? classObj.name : ''
      };
    });

    if (isConfigured) {
      try {
        const { data: dbStudents, error } = await supabase
          .from('students')
          .select(`
            *,
            user:users(name, email),
            class:classes(name)
          `)
          .eq('class_id', 'c1111111-1111-1111-1111-111111111111');

        if (!error && dbStudents) {
          const formattedDbStudents = dbStudents.map(s => ({
            id: s.id,
            user_id: s.user_id,
            student_id: s.student_id,
            roll_number: s.roll_number,
            class_id: s.class_id,
            address: s.address,
            phone: s.phone,
            date_of_birth: s.date_of_birth,
            name: s.user?.name || 'Unknown Student',
            email: s.user?.email || '',
            class_name: s.class?.name || 'Grade 10-A'
          }));

          // Avoid duplicate listings by removing matching class_id from mock database
          mockStudents = mockStudents.filter(s => s.class_id !== 'c1111111-1111-1111-1111-111111111111');
          mockStudents = [...mockStudents, ...formattedDbStudents];
        }
      } catch (err) {
        console.error('Failed to load students from Supabase:', err);
      }
    }

    if (searchQuery) {
      return mockStudents.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return mockStudents;
  },

  verifyProfile: async (userId, name, rollNumber) => {
    if (!isConfigured) {
      // Find user account
      const user = mockDb.users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User account not found.');
      }

      // Search all student profiles to find a match for this name and roll number
      const student = mockDb.students.find(s => {
        const sUser = mockDb.users.find(u => u.id === s.user_id);
        const sName = s.name || (sUser ? sUser.name : '');
        const nameMatches = sName.toLowerCase().trim() === name.toLowerCase().trim();
        
        const rollClean = s.roll_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        const inputRollClean = rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const rollMatches = rollClean === inputRollClean || rollClean.endsWith(inputRollClean);

        return nameMatches && rollMatches;
      });

      if (!student) {
        throw new Error('Verification failed. Name or Roll Number does not match our records.');
      }

      // Disassociate other student profiles currently linked to this userId
      mockDb.students.forEach(s => {
        if (s.user_id === userId && s.id !== student.id) {
          s.user_id = `old-${s.id}`;
        }
      });

      // Link matched student to this userId
      student.user_id = userId;
      user.name = name.trim(); // Update user display name to match official name
      mockDb.saveToDisk();

      const classObj = mockDb.classes.find(c => c.id === student.class_id);
      return {
        ...student,
        name: user.name,
        email: user.email,
        class_name: classObj ? classObj.name : ''
      };
    } else {
      // Supabase cloud database matching logic
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('*, user:users(*), class:classes(*)');

      if (studentError) throw studentError;

      const student = students.find(s => {
        const sName = s.name || (s.user ? s.user.name : '');
        const nameMatches = sName.toLowerCase().trim() === name.toLowerCase().trim();
        
        const rollClean = s.roll_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        const inputRollClean = rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const rollMatches = rollClean === inputRollClean || rollClean.endsWith(inputRollClean);

        return nameMatches && rollMatches;
      });

      if (!student) {
        throw new Error('Verification failed. Name or Roll Number does not match our records.');
      }

      // Link student to this userId
      const { error: updateStudentError } = await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('id', student.id);

      if (updateStudentError) throw updateStudentError;

      // Update user account name
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', userId);

      return {
        ...student,
        name: name.trim(),
        email: student.user ? student.user.email : '',
        class_name: student.class ? student.class.name : ''
      };
    }
  }
};

// Internal helpers
async function getStudentByUserId(userId) {
  const { data } = await supabase.from('students').select('*').eq('user_id', userId).single();
  return data;
}

async function getParentByUserId(userId) {
  const { data } = await supabase.from('parents').select('*').eq('user_id', userId).single();
  return data;
}

module.exports = studentService;
