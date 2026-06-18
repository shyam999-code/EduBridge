const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const behaviourService = {
  addBehaviourReport: async (reportData) => {
    if (!isConfigured) {
      const newReport = {
        id: `br-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString().split('T')[0],
        ...reportData,
        created_at: new Date()
      };
      mockDb.behaviour_reports.push(newReport);
      
      // Update student points in mock database
      const studentIdx = mockDb.students.findIndex(s => s.id === reportData.student_id);
      if (studentIdx !== -1) {
        // Assume baseline is 85 or standard points addition
        // If type is positive add points, else subtract
        const pointsChange = Number(reportData.points || (reportData.type === 'positive' ? 10 : -5));
        // We can just log report
      }
      mockDb.saveToDisk();
      return newReport;
    }

    const { data, error } = await supabase
      .from('behaviour_reports')
      .insert([reportData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getBehaviourReports: async (filters, requester) => {
    let studentId = filters.student_id;
    const showSpotlight = filters.spotlight === 'true' || filters.spotlight === true;

    // Apply security query filters for Student & Parent roles if NOT requesting the public spotlight
    if (!showSpotlight && (requester.role === 'student' || requester.role === 'parent')) {
      if (requester.role === 'student') {
        let student = null;
        if (isConfigured) {
          try { student = await getStudentByUserId(requester.id); } catch (e) { /* ignore */ }
        }
        if (!student) student = mockDb.students.find(s => s.user_id === requester.id);
        if (!student) throw { status: 404, message: 'Student record not linked' };
        studentId = student.id;
      } else if (requester.role === 'parent') {
        let parent = null;
        if (isConfigured) {
          try { parent = await getParentByUserId(requester.id); } catch (e) { /* ignore */ }
        }
        if (!parent) parent = mockDb.parents.find(p => p.user_id === requester.id);
        if (!parent || !parent.child_id) throw { status: 404, message: 'Linked child not found' };
        studentId = parent.child_id;
      }
    }

    if (!isConfigured) {
      let filtered = [...mockDb.behaviour_reports];

      if (showSpotlight) {
        filtered = filtered.filter(b => b.type === 'positive');
      } else if (studentId) {
        filtered = filtered.filter(b => b.student_id === studentId);
      }

      // Sort descending by date
      filtered.sort((a, b) => b.date.localeCompare(a.date));

      // Resolve student name, class and author name
      const records = filtered.map(report => {
        const student = mockDb.students.find(s => s.id === report.student_id);
        const user = student ? mockDb.users.find(u => u.id === student.user_id) : null;
        const classObj = student ? mockDb.classes.find(c => c.id === student.class_id) : null;
        const authorUser = mockDb.users.find(u => u.id === report.author_id);
        return {
          ...report,
          studentName: user ? user.name : 'Unknown Student',
          studentClass: classObj ? classObj.name : 'Unknown Class',
          authorName: authorUser ? authorUser.name : 'Mrs. Emily Davis'
        };
      });

      // Calculate total conduct points (assume 85 baseline) for non-spotlight views
      let conductPoints = 85;
      if (!showSpotlight && studentId) {
        filtered.forEach(report => {
          conductPoints += Number(report.points || 0);
        });
      }

      return {
        records,
        points: conductPoints
      };
    }

    try {
      // Supabase PostgreSQL mode
      let query;
      if (showSpotlight) {
        query = supabase.from('behaviour_reports').select(`
          *,
          author:users(name),
          student:students(
            *,
            user:users(name),
            class:classes(name)
          )
        `).eq('type', 'positive');
      } else {
        query = supabase.from('behaviour_reports').select(`
          *,
          author:users(name),
          student:students(
            *,
            user:users(name),
            class:classes(name)
          )
        `);
        if (studentId) {
          query = query.eq('student_id', studentId);
        }
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;

      const records = data.map(report => {
        let studentName = 'Unknown Student';
        let studentClass = 'Unknown Class';
        if (report.student) {
          studentName = report.student.user?.name || 'Unknown Student';
          studentClass = report.student.class?.name || 'Unknown Class';
        }
        return {
          ...report,
          studentName,
          studentClass,
          authorName: report.author?.name || 'Mrs. Emily Davis'
        };
      });

      let conductPoints = 85;
      if (!showSpotlight && studentId) {
        data.forEach(report => {
          conductPoints += Number(report.points || 0);
        });
      }

      return { records, points: conductPoints };
    } catch (err) {
      console.warn('[behaviourService] Supabase query failed, falling back to mockDb:', err.message || err);
      // Fallback to mockDb
      let filtered = [...mockDb.behaviour_reports];
      if (showSpotlight) {
        filtered = filtered.filter(b => b.type === 'positive');
      } else if (studentId) {
        filtered = filtered.filter(b => b.student_id === studentId);
      }
      filtered.sort((a, b) => b.date.localeCompare(a.date));
      const records = filtered.map(report => {
        const student = mockDb.students.find(s => s.id === report.student_id);
        const user = student ? mockDb.users.find(u => u.id === student.user_id) : null;
        const classObj = student ? mockDb.classes.find(c => c.id === student.class_id) : null;
        const authorUser = mockDb.users.find(u => u.id === report.author_id);
        return {
          ...report,
          studentName: user ? user.name : 'Unknown Student',
          studentClass: classObj ? classObj.name : 'Unknown Class',
          authorName: authorUser ? authorUser.name : 'Mrs. Emily Davis'
        };
      });
      let conductPoints = 85;
      if (!showSpotlight && studentId) {
        filtered.forEach(report => { conductPoints += Number(report.points || 0); });
      }
      return { records, points: conductPoints };
    }
  },

  deleteBehaviourReport: async (id) => {
    if (!isConfigured) {
      const index = mockDb.behaviour_reports.findIndex(b => b.id === id);
      if (index === -1) throw new Error('Behaviour remark not found');
      const deleted = mockDb.behaviour_reports.splice(index, 1);
      mockDb.saveToDisk();
      return deleted[0];
    }

    const { data, error } = await supabase
      .from('behaviour_reports')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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

module.exports = behaviourService;
