const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const homeworkService = {
  createHomework: async (homeworkData, requester) => {
    if (requester && requester.role === 'teacher') {
      let teacher = null;
      if (isConfigured) {
        try { teacher = await getTeacherByUserId(requester.id); } catch (e) { /* ignore */ }
      }
      if (!teacher) teacher = mockDb.teachers.find(t => t.user_id === requester.id);
      
      if (teacher && teacher.subject) {
        const allowedSubject = teacher.subject === 'Science'
          ? (homeworkData.subject === 'Science' || homeworkData.subject === 'Biology' || homeworkData.subject === 'Physics')
          : (teacher.subject === homeworkData.subject);
        if (!allowedSubject) {
          throw { status: 403, code: 'FORBIDDEN', message: `Privacy Restriction: You are only permitted to manage homework for your designated subject (${teacher.subject}).` };
        }
      }
    }

    if (!isConfigured) {
      const newHomework = {
        id: `HW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'Pending',
        ...homeworkData,
        created_at: new Date()
      };
      mockDb.homework.push(newHomework);
      return newHomework;
    }

    const { data, error } = await supabase
      .from('homework')
      .insert([homeworkData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateHomework: async (id, updateData, requester) => {
    if (requester && requester.role === 'teacher') {
      const teacher = isConfigured
        ? await getTeacherByUserId(requester.id)
        : mockDb.teachers.find(t => t.user_id === requester.id);
      
      if (teacher && teacher.subject && updateData.subject) {
        const allowedSubject = teacher.subject === 'Science'
          ? (updateData.subject === 'Science' || updateData.subject === 'Biology' || updateData.subject === 'Physics')
          : (teacher.subject === updateData.subject);
        if (!allowedSubject) {
          throw { status: 403, code: 'FORBIDDEN', message: `Privacy Restriction: You are only permitted to manage homework for your designated subject (${teacher.subject}).` };
        }
      }
    }

    if (!isConfigured) {
      const index = mockDb.homework.findIndex(h => h.id === id);
      if (index === -1) throw new Error('Homework not found');
      mockDb.homework[index] = { ...mockDb.homework[index], ...updateData };
      return mockDb.homework[index];
    }

    const { data, error } = await supabase
      .from('homework')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteHomework: async (id) => {
    if (!isConfigured) {
      const index = mockDb.homework.findIndex(h => h.id === id);
      if (index === -1) throw new Error('Homework not found');
      const deleted = mockDb.homework.splice(index, 1);
      return deleted[0];
    }

    const { data, error } = await supabase
      .from('homework')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getHomework: async (filters, requester) => {
    let classId = filters.class_id;

    // Apply security query filters for Student & Parent roles (fetch their class_id)
    if (requester.role === 'student') {
      let student = null;
      if (isConfigured) {
        try { student = await getStudentByUserId(requester.id); } catch (e) { /* ignore */ }
      }
      if (!student) student = mockDb.students.find(s => s.user_id === requester.id);
      if (!student) throw { status: 404, message: 'Student record not linked' };
      classId = student.class_id;
    } else if (requester.role === 'parent') {
      let parent = null;
      if (isConfigured) {
        try { parent = await getParentByUserId(requester.id); } catch (e) { /* ignore */ }
      }
      if (!parent) parent = mockDb.parents.find(p => p.user_id === requester.id);
      if (!parent || !parent.child_id) throw { status: 404, message: 'Linked child not found' };
      
      let student = null;
      if (isConfigured) {
        try { student = await getStudentById(parent.child_id); } catch (e) { /* ignore */ }
      }
      if (!student) student = mockDb.students.find(s => s.id === parent.child_id);
      if (!student) throw { status: 404, message: 'Student details not found' };
      classId = student.class_id;
    }

    if (!isConfigured) {
      let filtered = [...mockDb.homework];

      if (classId) {
        filtered = filtered.filter(h => h.class_id === classId);
      }
      if (filters.subject) {
        filtered = filtered.filter(h => h.subject.toLowerCase() === filters.subject.toLowerCase());
      }

      // Sort descending by due date
      filtered.sort((a, b) => b.due_date.localeCompare(a.due_date));
      return filtered;
    }

    try {
      let query = supabase.from('homework').select('*');

      if (classId) {
        query = query.eq('class_id', classId);
      }
      if (filters.subject) {
        query = query.ilike('subject', filters.subject);
      }

      const { data, error } = await query.order('due_date', { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[homeworkService] Supabase query failed, falling back to mockDb:', err.message || err);
      let filtered = [...mockDb.homework];
      if (classId) filtered = filtered.filter(h => h.class_id === classId);
      if (filters.subject) filtered = filtered.filter(h => h.subject.toLowerCase() === filters.subject.toLowerCase());
      filtered.sort((a, b) => b.due_date.localeCompare(a.due_date));
      return filtered;
    }
  }
};

async function getStudentByUserId(userId) {
  const { data } = await supabase.from('students').select('*').eq('user_id', userId).single();
  return data;
}

async function getStudentById(id) {
  const { data } = await supabase.from('students').select('*').eq('id', id).single();
  return data;
}

async function getParentByUserId(userId) {
  const { data } = await supabase.from('parents').select('*').eq('user_id', userId).single();
  return data;
}

async function getTeacherByUserId(userId) {
  const { data } = await supabase.from('teachers').select('*').eq('user_id', userId).single();
  return data;
}

module.exports = homeworkService;
