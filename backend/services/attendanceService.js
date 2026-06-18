const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const attendanceService = {
  markAttendance: async (attendanceData, requester) => {
    if (requester && requester.role === 'teacher') {
      let teacher = null;
      if (isConfigured) {
        try {
          teacher = await getTeacherByUserId(requester.id);
        } catch (e) {
          // Supabase lookup failed for mock user, fall back to mockDb
        }
      }
      if (!teacher) {
        teacher = mockDb.teachers.find(t => t.user_id === requester.id);
      }
      if (!teacher || !teacher.subject) {
        throw { status: 403, code: 'FORBIDDEN', message: 'Privacy Restriction: You must configure your primary instruction subject before you are permitted to post attendance.' };
      }
      
      if (attendanceData.subject && teacher.subject) {
        const allowedSubject = teacher.subject === 'Science'
          ? (attendanceData.subject === 'Science' || attendanceData.subject === 'Biology' || attendanceData.subject === 'Physics')
          : (teacher.subject === attendanceData.subject);
        if (!allowedSubject) {
          throw { status: 403, code: 'FORBIDDEN', message: `Privacy Restriction: You are only permitted to manage attendance for your designated subject (${teacher.subject}).` };
        }
      }

      // Enforce Class Teacher gating and date locking
      if (mockDb.timetable) {
        const student = mockDb.students.find(s => s.id === attendanceData.student_id);
        if (student) {
          const classTeacher = (mockDb.timetable.classTeachers || []).find(ct => ct.classId === student.class_id);
          if (!classTeacher || classTeacher.teacherId !== teacher.id) {
            throw { status: 403, code: 'FORBIDDEN', message: 'Only the assigned Class Teacher can record attendance for this class.' };
          }

          const isLocked = (mockDb.timetable.lockedDates || []).some(ld => ld.classId === student.class_id && ld.date === attendanceData.date);
          if (isLocked) {
            throw { status: 403, code: 'FORBIDDEN', message: 'Attendance register is locked for today. Admin must unlock it for corrections.' };
          }
        }
      }
    }

    if (!isConfigured) {
      // Find if duplicate date-student log exists
      const existingIdx = mockDb.attendance.findIndex(
        a => a.student_id === attendanceData.student_id && a.date === attendanceData.date
      );

      const autoLockIfComplete = () => {
        const student = mockDb.students.find(s => s.id === attendanceData.student_id);
        if (student && mockDb.timetable) {
          const classStudents = mockDb.students.filter(s => s.class_id === student.class_id);
          const classStudentIds = classStudents.map(s => s.id);
          const existingRecords = mockDb.attendance.filter(
            a => classStudentIds.includes(a.student_id) && a.date === attendanceData.date
          );
          
          const uniqueClassStudentIds = new Set(classStudents.map(s => s.id));
          const uniqueExistingRecordIds = new Set(existingRecords.map(a => a.student_id));

          if (uniqueExistingRecordIds.size === uniqueClassStudentIds.size) {
            if (!mockDb.timetable.lockedDates) {
              mockDb.timetable.lockedDates = [];
            }
            const alreadyLocked = mockDb.timetable.lockedDates.some(
              l => l.classId === student.class_id && l.date === attendanceData.date
            );
            if (!alreadyLocked) {
              mockDb.timetable.lockedDates.push({ classId: student.class_id, date: attendanceData.date });
            }
          }
        }
      };

      if (existingIdx !== -1) {
        const updatedLog = {
          ...mockDb.attendance[existingIdx],
          ...attendanceData
        };
        updatedLog.remarks = updatedLog.status === 'Present' ? 'On time' : (updatedLog.status === 'Absent' ? 'Absent' : 'Unmarked');
        updatedLog.check_in = updatedLog.status === 'Present' ? '07:45 AM' : '-';
        
        mockDb.attendance[existingIdx] = updatedLog;
        autoLockIfComplete();
        mockDb.saveToDisk();
        return updatedLog;
      }

      // Strip extra attributes like subject since they aren't in schema
      const { subject, ...cleanData } = attendanceData;

      const newLog = {
        id: `att-${Math.random().toString(36).substr(2, 9)}`,
        remarks: cleanData.status === 'Present' ? 'On time' : (cleanData.status === 'Absent' ? 'Absent' : 'Unmarked'),
        check_in: cleanData.status === 'Present' ? '07:45 AM' : '-',
        ...cleanData,
        created_at: new Date()
      };
      mockDb.attendance.push(newLog);
      autoLockIfComplete();
      mockDb.saveToDisk();
      return newLog;
    }

    const { subject, ...cleanData } = attendanceData;

    const { data, error } = await supabase
      .from('attendance')
      .upsert([cleanData], { onConflict: 'student_id, date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateAttendance: async (attendanceData, requester) => {
    // Reuses markAttendance since it performs upsert logic on conflict
    return attendanceService.markAttendance(attendanceData, requester);
  },

  getAttendance: async (filters, requester) => {
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

    if (!isConfigured) {
      let filtered = [...mockDb.attendance];

      if (studentId) {
        filtered = filtered.filter(a => a.student_id === studentId);
      }
      if (filters.date) {
        filtered = filtered.filter(a => a.date === filters.date);
      }
      if (filters.month) { // YYYY-MM
        filtered = filtered.filter(a => a.date.startsWith(filters.month));
      }

      // Sort descending by date
      filtered.sort((a, b) => b.date.localeCompare(a.date));

      // Calculate summary stats if filtering for specific student
      let summary = null;
      if (studentId) {
        const total = filtered.length;
        const present = filtered.filter(a => a.status === 'Present').length;
        const absent = filtered.filter(a => a.status === 'Absent').length;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;
        summary = { present, absent, total, percentage };
      }

      return {
        records: filtered,
        summary
      };
    }

    try {
      let query = supabase.from('attendance').select('*');

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      if (filters.month) {
        query = query.gte('date', `${filters.month}-01`).lte('date', `${filters.month}-31`);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;

      let summary = null;
      if (studentId) {
        const total = data.length;
        const present = data.filter(a => a.status === 'Present').length;
        const absent = data.filter(a => a.status === 'Absent').length;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;
        summary = { present, absent, total, percentage };
      }

      return { records: data, summary };
    } catch (err) {
      console.warn('[attendanceService] Supabase query failed, falling back to mockDb:', err.message || err);
      // Fallback to mockDb
      let filtered = [...mockDb.attendance];
      if (studentId) filtered = filtered.filter(a => a.student_id === studentId);
      if (filters.date) filtered = filtered.filter(a => a.date === filters.date);
      if (filters.month) filtered = filtered.filter(a => a.date.startsWith(filters.month));
      filtered.sort((a, b) => b.date.localeCompare(a.date));
      let summary = null;
      if (studentId) {
        const total = filtered.length;
        const present = filtered.filter(a => a.status === 'Present').length;
        const absent = filtered.filter(a => a.status === 'Absent').length;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;
        summary = { present, absent, total, percentage };
      }
      return { records: filtered, summary };
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

module.exports = attendanceService;
