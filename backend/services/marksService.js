const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const marksService = {
  addMarks: async (marksData, requester) => {
    if (requester && requester.role === 'teacher') {
      let teacher = null;
      if (isConfigured) {
        try { teacher = await getTeacherByUserId(requester.id); } catch (e) { /* ignore */ }
      }
      if (!teacher) teacher = mockDb.teachers.find(t => t.user_id === requester.id);
      
      if (teacher && teacher.subject) {
        const allowedSubject = teacher.subject === 'Science'
          ? (marksData.subject === 'Science' || marksData.subject === 'Biology' || marksData.subject === 'Physics')
          : (teacher.subject === marksData.subject);
        if (!allowedSubject) {
          throw { status: 403, code: 'FORBIDDEN', message: `Privacy Restriction: You are only permitted to manage grades for your designated subject (${teacher.subject}).` };
        }
      }
    }

    if (!isConfigured) {
      const existingIdx = mockDb.marks.findIndex(
        m => m.student_id === marksData.student_id && m.subject === marksData.subject && m.type === (marksData.type || 'Annual Exam')
      );

      if (existingIdx !== -1) {
        mockDb.marks[existingIdx] = {
          ...mockDb.marks[existingIdx],
          ...marksData
        };
        return mockDb.marks[existingIdx];
      }

      const newMark = {
        id: `mrk-${Math.random().toString(36).substr(2, 9)}`,
        biology_score: marksData.subject === 'Science' ? (marksData.biology_score || 0) : null,
        physics_score: marksData.subject === 'Science' ? (marksData.physics_score || 0) : null,
        max_score: 100,
        type: 'Annual Exam',
        ...marksData,
        created_at: new Date()
      };
      mockDb.marks.push(newMark);
      return newMark;
    }

    const { data, error } = await supabase
      .from('marks')
      .upsert([marksData], { onConflict: 'student_id, subject, type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateMarks: async (marksData, requester) => {
    return marksService.addMarks(marksData, requester);
  },

  getMarks: async (filters, requester) => {
    let studentId = filters.student_id;

    // Apply security query filters for Student & Parent roles
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

    const expandScienceMarks = (records) => {
      let expanded = [];
      records.forEach(m => {
        if (m.subject === 'Science') {
          expanded.push({
            ...m,
            id: `${m.id}-bio`,
            subject: 'Biology',
            score: m.biology_score !== null && m.biology_score !== undefined ? m.biology_score : Math.round(m.score / 2),
            max_score: 50
          });
          expanded.push({
            ...m,
            id: `${m.id}-phy`,
            subject: 'Physics',
            score: m.physics_score !== null && m.physics_score !== undefined ? m.physics_score : (m.score - (m.biology_score || Math.round(m.score / 2))),
            max_score: 50
          });
        } else {
          expanded.push(m);
        }
      });
      return expanded;
    };

    if (!isConfigured) {
      let filtered = [...mockDb.marks];

      if (studentId) {
        filtered = filtered.filter(m => m.student_id === studentId);
      }
      
      filtered = expandScienceMarks(filtered);

      if (filters.subject) {
        filtered = filtered.filter(m => m.subject === filters.subject);
      }

      return filtered.map(m => {
        const student = mockDb.students.find(s => s.id === m.student_id);
        const studentUser = student ? mockDb.users.find(u => u.id === student.user_id) : null;
        return {
          ...m,
          studentName: studentUser ? studentUser.name : 'Unknown Student',
          rollNumber: student ? student.roll_number : ''
        };
      });
    }

    try {
      let query = supabase.from('marks').select('*');

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (filters.subject) {
        if (filters.subject === 'Biology' || filters.subject === 'Physics') {
          query = query.in('subject', [filters.subject, 'Science']);
        } else {
          query = query.eq('subject', filters.subject);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let expandedData = expandScienceMarks(data);
      if (filters.subject) {
        expandedData = expandedData.filter(m => m.subject === filters.subject);
      }
      return expandedData;
    } catch (err) {
      console.warn('[marksService] Supabase query failed, falling back to mockDb:', err.message || err);
      // Fallback to mockDb
      let filtered = [...mockDb.marks];
      if (studentId) filtered = filtered.filter(m => m.student_id === studentId);
      if (filters.subject) filtered = filtered.filter(m => m.subject === filters.subject);
      return filtered.map(m => {
        const student = mockDb.students.find(s => s.id === m.student_id);
        const studentUser = student ? mockDb.users.find(u => u.id === student.user_id) : null;
        return { ...m, studentName: studentUser ? studentUser.name : 'Unknown Student', rollNumber: student ? student.roll_number : '' };
      });
    }
  },

  getStudentReport: async (studentId, requester) => {
    const filters = { student_id: studentId };
    const records = await marksService.getMarks(filters, requester);

    // Main overall grade metrics are based strictly on "Annual Exam" results.
    const mainRecords = records.filter(r => r.type === 'Annual Exam');

    const totalScore = mainRecords.length > 0
      ? mainRecords.reduce((acc, curr) => acc + Number(curr.score), 0)
      : records.reduce((acc, curr) => acc + Number(curr.score), 0);
      
    const maxPossible = mainRecords.length > 0
      ? mainRecords.reduce((acc, curr) => acc + Number(curr.max_score), 0)
      : records.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    const percentageVal = maxPossible > 0 ? Number(((totalScore / maxPossible) * 100).toFixed(1)) : 0;

    let resultStatus = 'Passed';
    const checkRecords = mainRecords.length > 0 ? mainRecords : records;
    if (checkRecords.some(m => Number(m.score) < 35)) {
      resultStatus = 'Failed / Needs Improvement';
    } else if (percentageVal >= 75) {
      resultStatus = 'Passed with Distinction';
    }

    return {
      student_id: studentId,
      totalScore,
      maxPossible,
      percentage: `${percentageVal}%`,
      resultStatus,
      subjectBreakdown: records
    };
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

module.exports = marksService;
