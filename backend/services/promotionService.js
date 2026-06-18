const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const promotionService = {
  // Promote a single student
  promoteStudent: async (studentId, targetClassId, academicYear, promotedBy) => {
    // 1. Get student details to resolve previous class name
    let student = null;
    let prevClassName = 'Unknown Class';
    let prevClassId = null;

    if (isConfigured) {
      const { data, error } = await supabase
        .from('students')
        .select('*, class:classes(*)')
        .eq('id', studentId)
        .single();
      if (error || !data) throw new Error('Student not found.');
      student = data;
      prevClassName = data.class ? data.class.name : 'Unassigned';
      prevClassId = data.class_id;
    } else {
      student = mockDb.students.find(s => s.id === studentId);
      if (!student) throw new Error('Student not found.');
      prevClassId = student.class_id;
      const cls = mockDb.classes.find(c => c.id === prevClassId);
      prevClassName = cls ? cls.name : 'Unassigned';
    }

    // 2. Compile summaries
    const summaries = await compileSummaries(studentId, prevClassName, academicYear);

    // 3. Save past performance record & Clear active records & Update student class ID & Log promotion
    if (isConfigured) {
      // Create past performance record
      const { error: perfError } = await supabase
        .from('past_performance')
        .insert([{
          student_id: studentId,
          academic_year: academicYear,
          previous_class_name: prevClassName,
          marks_summary: summaries.marks,
          attendance_summary: summaries.attendance,
          complaint_summary: summaries.complaints,
          teacher_remarks: summaries.remarks
        }]);
      if (perfError) throw perfError;

      // Clear current year records
      await supabase.from('marks').delete().eq('student_id', studentId);
      await supabase.from('attendance').delete().eq('student_id', studentId);
      await supabase.from('behaviour_reports').delete().eq('student_id', studentId);
      await supabase.from('complaints').delete().eq('student_id', studentId);

      // Update student class
      const { error: updateError } = await supabase
        .from('students')
        .update({ class_id: targetClassId, status: 'Enrolled' })
        .eq('id', studentId);
      if (updateError) throw updateError;

      // Log promotion
      const { error: logError } = await supabase
        .from('promotions')
        .insert([{
          student_id: studentId,
          previous_class_id: prevClassId,
          new_class_id: targetClassId,
          academic_year: academicYear,
          status: 'Promoted',
          promoted_by: promotedBy
        }]);
      if (logError) throw logError;
    } else {
      // Mock DB updates
      mockDb.past_performance.push({
        id: `perf-${Math.random().toString(36).substr(2, 9)}`,
        student_id: studentId,
        academic_year: academicYear,
        previous_class_name: prevClassName,
        marks_summary: summaries.marks,
        attendance_summary: summaries.attendance,
        complaint_summary: summaries.complaints,
        teacher_remarks: summaries.remarks,
        created_at: new Date()
      });

      // Clear current year records from mock lists
      mockDb.marks = mockDb.marks.filter(m => m.student_id !== studentId);
      mockDb.attendance = mockDb.attendance.filter(a => a.student_id !== studentId);
      mockDb.behaviour_reports = mockDb.behaviour_reports.filter(b => b.student_id !== studentId);
      mockDb.complaints = mockDb.complaints.filter(c => c.student_id !== studentId);

      // Update student
      student.class_id = targetClassId;
      student.status = 'Enrolled';

      // Log promotion
      mockDb.promotions.push({
        id: `prom-${Math.random().toString(36).substr(2, 9)}`,
        student_id: studentId,
        previous_class_id: prevClassId,
        new_class_id: targetClassId,
        academic_year: academicYear,
        status: 'Promoted',
        promoted_by: promotedBy,
        created_at: new Date()
      });

      mockDb.saveToDisk();
    }

    return { success: true, studentId, targetClassId, status: 'Promoted' };
  },

  // Promote an entire class
  promoteClass: async (sourceClassId, targetClassId, academicYear, promotedBy) => {
    let studentsToPromote = [];

    if (isConfigured) {
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', sourceClassId);
      if (error) throw error;
      studentsToPromote = data || [];
    } else {
      studentsToPromote = mockDb.students.filter(s => s.class_id === sourceClassId);
    }

    const results = [];
    for (const student of studentsToPromote) {
      try {
        const res = await promotionService.promoteStudent(student.id, targetClassId, academicYear, promotedBy);
        results.push(res);
      } catch (err) {
        console.error(`Failed to promote student ${student.id}:`, err);
      }
    }

    return { success: true, promotedCount: results.length };
  },

  // Complete schooling for single/multiple students (Grade 10)
  completeSchooling: async (studentIds, academicYear, promotedBy) => {
    const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
    const results = [];

    for (const studentId of ids) {
      // 1. Get student details
      let student = null;
      let prevClassName = 'Grade 10';
      let prevClassId = null;

      if (isConfigured) {
        const { data, error } = await supabase
          .from('students')
          .select('*, class:classes(*)')
          .eq('id', studentId)
          .single();
        if (!error && data) {
          student = data;
          prevClassName = data.class ? data.class.name : 'Grade 10';
          prevClassId = data.class_id;
        }
      } else {
        student = mockDb.students.find(s => s.id === studentId);
        if (student) {
          prevClassId = student.class_id;
          const cls = mockDb.classes.find(c => c.id === prevClassId);
          prevClassName = cls ? cls.name : 'Grade 10';
        }
      }

      if (!student) continue;

      // 2. Compile summaries
      const summaries = await compileSummaries(studentId, prevClassName, academicYear);

      // 3. Save past performance record & Clear active records & Set status to Completed Schooling
      if (isConfigured) {
        // Create past performance record
        await supabase.from('past_performance').insert([{
          student_id: studentId,
          academic_year: academicYear,
          previous_class_name: prevClassName,
          marks_summary: summaries.marks,
          attendance_summary: summaries.attendance,
          complaint_summary: summaries.complaints,
          teacher_remarks: summaries.remarks
        }]);

        // Clear current year records
        await supabase.from('marks').delete().eq('student_id', studentId);
        await supabase.from('attendance').delete().eq('student_id', studentId);
        await supabase.from('behaviour_reports').delete().eq('student_id', studentId);
        await supabase.from('complaints').delete().eq('student_id', studentId);

        // Update student as completed schooling
        await supabase
          .from('students')
          .update({ class_id: null, status: 'Completed Schooling' })
          .eq('id', studentId);

        // Log Completed Schooling
        await supabase.from('promotions').insert([{
          student_id: studentId,
          previous_class_id: prevClassId,
          new_class_id: null,
          academic_year: academicYear,
          status: 'Completed Schooling',
          promoted_by: promotedBy
        }]);
      } else {
        // Mock DB updates
        mockDb.past_performance.push({
          id: `perf-${Math.random().toString(36).substr(2, 9)}`,
          student_id: studentId,
          academic_year: academicYear,
          previous_class_name: prevClassName,
          marks_summary: summaries.marks,
          attendance_summary: summaries.attendance,
          complaint_summary: summaries.complaints,
          teacher_remarks: summaries.remarks,
          created_at: new Date()
        });

        // Clear active records
        mockDb.marks = mockDb.marks.filter(m => m.student_id !== studentId);
        mockDb.attendance = mockDb.attendance.filter(a => a.student_id !== studentId);
        mockDb.behaviour_reports = mockDb.behaviour_reports.filter(b => b.student_id !== studentId);
        mockDb.complaints = mockDb.complaints.filter(c => c.student_id !== studentId);

        // Update student details
        student.class_id = null;
        student.status = 'Completed Schooling';

        // Log completed schooling
        mockDb.promotions.push({
          id: `prom-${Math.random().toString(36).substr(2, 9)}`,
          student_id: studentId,
          previous_class_id: prevClassId,
          new_class_id: null,
          academic_year: academicYear,
          status: 'Completed Schooling',
          promoted_by: promotedBy,
          created_at: new Date()
        });

        mockDb.saveToDisk();
      }

      results.push({ studentId, status: 'Completed Schooling' });
    }

    return { success: true, completedSchoolingCount: results.length };
  },

  // Get promotion log logs
  getPromotionHistory: async () => {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          student:students(
            id,
            roll_number,
            user:users(name)
          ),
          previous_class:classes!promotions_previous_class_id_fkey(name),
          new_class:classes!promotions_new_class_id_fkey(name),
          promoter:users!promotions_promoted_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(row => ({
        id: row.id,
        studentName: row.student?.user?.name || 'Unknown Student',
        rollNumber: row.student?.roll_number || 'N/A',
        previousClassName: row.previous_class ? row.previous_class.name : 'Unassigned',
        newClassName: row.new_class ? row.new_class.name : (row.status === 'Completed Schooling' ? 'Completed Schooling' : 'Unassigned'),
        academicYear: row.academic_year,
        status: row.status,
        promotedByName: row.promoter ? row.promoter.name : 'Admin',
        promotedAt: row.created_at
      }));
    } else {
      // Sort mock promotions descending by date
      const sorted = [...mockDb.promotions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return sorted.map(row => {
        const student = mockDb.students.find(s => s.id === row.student_id);
        const user = student ? mockDb.users.find(u => u.id === student.user_id) : null;
        
        const prevClass = mockDb.classes.find(c => c.id === row.previous_class_id);
        const newClass = mockDb.classes.find(c => c.id === row.new_class_id);

        const promoter = mockDb.users.find(u => u.id === row.promoted_by);

        return {
          id: row.id,
          studentName: user ? user.name : 'Unknown Student',
          rollNumber: student ? student.roll_number : 'N/A',
          previousClassName: prevClass ? prevClass.name : 'Unassigned',
          newClassName: newClass ? newClass.name : (row.status === 'Completed Schooling' ? 'Completed Schooling' : 'Unassigned'),
          academicYear: row.academic_year,
          status: row.status,
          promotedByName: promoter ? promoter.name : 'Admin',
          promotedAt: row.created_at
        };
      });
    }
  },

  // Get past performance records for a student
  getPastPerformance: async (studentId) => {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('past_performance')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return mockDb.past_performance
        .filter(p => p.student_id === studentId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  // Get active students list
  getActiveStudents: async () => {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          user:users(name, email),
          class:classes(name)
        `)
        .neq('status', 'Completed Schooling');
      if (error) throw error;
      return data.map(s => ({
        id: s.id,
        name: s.user?.name || 'Unknown Student',
        roll_number: s.roll_number,
        class_id: s.class_id,
        class_name: s.class?.name || 'Unassigned',
        status: s.status || 'Enrolled'
      }));
    } else {
      return mockDb.students
        .filter(s => s.status !== 'Completed Schooling')
        .map(s => {
          const user = mockDb.users.find(u => u.id === s.user_id);
          const cls = mockDb.classes.find(c => c.id === s.class_id);
          return {
            id: s.id,
            name: user ? user.name : 'Unknown Student',
            roll_number: s.roll_number,
            class_id: s.class_id,
            class_name: cls ? cls.name : 'Unassigned',
            status: s.status || 'Enrolled'
          };
        });
    }
  },

  // Get completed schooling students list
  getCompletedSchoolingStudents: async () => {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          user:users(name, email)
        `)
        .eq('status', 'Completed Schooling');
      if (error) throw error;
      return data.map(s => ({
        id: s.id,
        name: s.user?.name || 'Unknown Student',
        roll_number: s.roll_number,
        class_id: s.class_id,
        class_name: 'Completed Schooling',
        status: s.status
      }));
    } else {
      return mockDb.students
        .filter(s => s.status === 'Completed Schooling')
        .map(s => {
          const user = mockDb.users.find(u => u.id === s.user_id);
          return {
            id: s.id,
            name: user ? user.name : 'Unknown Student',
            roll_number: s.roll_number,
            class_id: s.class_id,
            class_name: 'Completed Schooling',
            status: s.status
          };
        });
    }
  }
};

// Helper: Compile active summaries into view-only snapshots
async function compileSummaries(studentId, prevClassName, academicYear) {
  let activeMarks = [];
  let activeAttendance = [];
  let activeComplaints = [];
  let activeBehaviour = [];

  if (isConfigured) {
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId);
    activeMarks = marks || [];

    const { data: attendance } = await supabase.from('attendance').select('*').eq('student_id', studentId);
    activeAttendance = attendance || [];

    const { data: complaints } = await supabase.from('complaints').select('*').eq('student_id', studentId);
    activeComplaints = complaints || [];

    const { data: behaviour } = await supabase.from('behaviour_reports').select('*').eq('student_id', studentId);
    activeBehaviour = behaviour || [];
  } else {
    activeMarks = mockDb.marks.filter(m => m.student_id === studentId);
    activeAttendance = mockDb.attendance.filter(a => a.student_id === studentId);
    activeComplaints = mockDb.complaints.filter(c => c.student_id === studentId);
    activeBehaviour = mockDb.behaviour_reports.filter(b => b.student_id === studentId);
  }

  // 1. Marks Compilation
  const totalScore = activeMarks.reduce((sum, m) => sum + Number(m.score), 0);
  const maxScore = activeMarks.reduce((sum, m) => sum + Number(m.max_score || 100), 0);
  const averageScore = activeMarks.length > 0 ? (totalScore / activeMarks.length) : 0;
  const marksSummary = {
    average_score: Number(averageScore.toFixed(1)),
    total_marks: totalScore,
    max_score: maxScore,
    subjects: activeMarks.map(m => ({
      subject: m.subject,
      score: m.score,
      max_score: m.max_score,
      type: m.type,
      date: m.date
    }))
  };

  // 2. Attendance Compilation
  const totalDays = activeAttendance.length;
  const presentDays = activeAttendance.filter(a => a.status === 'Present').length;
  const absentDays = activeAttendance.filter(a => a.status === 'Absent').length;
  const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;
  const attendanceSummary = {
    percentage: attendancePercentage,
    present_days: presentDays,
    absent_days: absentDays,
    total_days: totalDays
  };

  // 3. Complaint Compilation
  const complaintSummary = {
    total: activeComplaints.length,
    pending: activeComplaints.filter(c => c.status !== 'Resolved').length,
    resolved: activeComplaints.filter(c => c.status === 'Resolved').length
  };

  // 4. Remarks & Observations
  const teacherRemarks = activeBehaviour
    .map(b => `[${b.date}] ${b.title}: ${b.description} (${b.points > 0 ? '+' : ''}${b.points} pts)`)
    .join('\n') || 'No general conduct reports or remarks registered for this student.';

  return {
    marks: marksSummary,
    attendance: attendanceSummary,
    complaints: complaintSummary,
    remarks: teacherRemarks
  };
}

module.exports = promotionService;
