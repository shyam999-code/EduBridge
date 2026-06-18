const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const complaintService = {
  createComplaint: async (complaintData, requester) => {
    let studentId = complaintData.student_id || null;

    if (requester.role === 'student') {
      let student = null;
      if (isConfigured) {
        try { student = await getStudentByUserId(requester.id); } catch (e) { /* ignore */ }
      }
      if (!student) student = mockDb.students.find(s => s.user_id === requester.id);
      studentId = student ? student.id : null;
    } else if (requester.role === 'parent') {
      let parent = null;
      if (isConfigured) {
        try { parent = await getParentByUserId(requester.id); } catch (e) { /* ignore */ }
      }
      if (!parent) parent = mockDb.parents.find(p => p.user_id === requester.id);
      studentId = parent ? parent.child_id : null;
    }

    const newLog = {
      title: complaintData.title,
      description: complaintData.description,
      status: 'Pending',
      response: '',
      date: new Date().toISOString().split('T')[0],
      submitted_by: requester.id,
      student_id: studentId,
      student_name: complaintData.student_name || null,
      student_class: complaintData.student_class || null
    };

    if (!isConfigured) {
      const created = {
        id: `CPL-${100 + mockDb.complaints.length + 1}`,
        ...newLog,
        created_at: new Date()
      };
      mockDb.complaints.unshift(created);
      mockDb.saveToDisk();
      return created;
    }

    const { data, error } = await supabase
      .from('complaints')
      .insert([newLog])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateComplaintStatus: async (id, status, response = '') => {
    if (!isConfigured) {
      const index = mockDb.complaints.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Complaint not found');
      mockDb.complaints[index].status = status;
      if (response) {
        mockDb.complaints[index].response = response;
      }
      mockDb.saveToDisk();
      return mockDb.complaints[index];
    }

    const { data, error } = await supabase
      .from('complaints')
      .update({ status, response })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getComplaints: async (requester) => {
    if (!isConfigured) {
      let filtered = [...mockDb.complaints];

      // Gating visibility
      if (requester.role !== 'admin') {
        filtered = filtered.filter(c => c.submitted_by === requester.id);
      }

      // Add submitter names for convenience
      return filtered.map(c => {
        const user = mockDb.users.find(u => u.id === c.submitted_by);
        let submitterName = user ? user.name : 'System User';
        
        if (c.student_name && c.student_class) {
          submitterName = `${submitterName} (Parent of ${c.student_name} - ${c.student_class})`;
        } else if (user && user.role === 'parent') {
          // Fallback: look up in database linked tables for legacy/seeding records
          const parent = mockDb.parents.find(p => p.user_id === user.id);
          const student = parent ? mockDb.students.find(s => s.id === parent.child_id) : null;
          if (student) {
            submitterName = `${user.name} (Parent of ${student.name} - Class 8)`;
          }
        }

        return {
          ...c,
          submitted_by_name: submitterName
        };
      });
    }

    try {
      let query = supabase.from('complaints').select(`
        *,
        submitted_by_user:users!submitted_by(name)
      `);

      if (requester.role !== 'admin') {
        query = query.eq('submitted_by', requester.id);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[complaintService] Supabase query failed, falling back to mockDb:', err.message || err);
      let filtered = [...mockDb.complaints];
      if (requester.role !== 'admin') {
        filtered = filtered.filter(c => c.submitted_by === requester.id);
      }
      return filtered.map(c => {
        const user = mockDb.users.find(u => u.id === c.submitted_by);
        let submitterName = user ? user.name : 'System User';
        if (c.student_name && c.student_class) {
          submitterName = `${submitterName} (Parent of ${c.student_name} - ${c.student_class})`;
        }
        return { ...c, submitted_by_name: submitterName };
      });
    }
  }
};

async function getStudentByUserId(userId) {
  const { data } = await supabase.from('students').select('*').eq('user_id', userId).single();
  return data;
}

async function getParentByUserId(userId) {
  const { data } = await supabase.from('parents').select('*').eq('user_id', userId).single();
  return data;
}

module.exports = complaintService;
