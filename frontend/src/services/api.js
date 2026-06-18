/**
 * EDUBRIDGE SMART SCHOOL ERP SYSTEM - CORE API INTEGRATION SERVICE
 * Bridges the React.js frontend views to Node.js/Express cloud APIs.
 * Stores JWT tokens and injects standard Bearer Authorization headers reactively.
 */

// Environmental Bases loaded via Vite imports
const AUTH_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api/auth';
const BUSINESS_URL = import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:5001/api';

/**
 * Standard utility to fetch token and create headers.
 */
const getHeaders = () => {
  const token = localStorage.getItem('edubridge_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // =========================================================
  // 1. AUTHENTICATION MODULE SERVICES
  // =========================================================
  login: async (userId, password, role) => {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userId, password, role })
    });
    
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Login credentials incorrect.');
    }
    
    // Set token & user profiles cleanly
    localStorage.setItem('edubridge_token', resData.token);
    localStorage.setItem('edutrack_user', JSON.stringify(resData.user));
    
    return {
      success: true,
      user: resData.user
    };
  },

  register: async (userId, password, role) => {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userId, password, role })
    });
    
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Registration failed.');
    }
    
    // Set token & user profiles cleanly
    localStorage.setItem('edubridge_token', resData.token);
    localStorage.setItem('edutrack_user', JSON.stringify(resData.user));
    
    return {
      success: true,
      user: resData.user
    };
  },

  registerAdminRequest: async (fullName, schoolName, email, mobileNumber, password) => {
    const response = await fetch(`${AUTH_URL}/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, schoolName, email, mobileNumber, password })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Admin registration request failed.');
    }
    return resData;
  },

  listAdminRegistrations: async () => {
    const response = await fetch(`${AUTH_URL}/admin-registrations`, {
      method: 'GET',
      headers: getHeaders()
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to retrieve registration roster.');
    }
    return resData.registrations || [];
  },

  approveAdminRegistration: async (id) => {
    const response = await fetch(`${AUTH_URL}/admin-registrations/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to approve registration.');
    }
    return resData.registration;
  },

  rejectAdminRegistration: async (id) => {
    const response = await fetch(`${AUTH_URL}/admin-registrations/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to reject registration.');
    }
    return resData.registration;
  },

  removeAdminRegistration: async (id) => {
    const response = await fetch(`${AUTH_URL}/admin-registrations/remove`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to remove admin.');
    }
    return resData.registration;
  },

  logout: async () => {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch (e) {
      console.warn('Stateless JWT discard warning', e);
    }
    // Discard locally anyway
    localStorage.removeItem('edubridge_token');
    localStorage.removeItem('edutrack_user');
    localStorage.removeItem('edubridge_student_verified');
    localStorage.removeItem('active_science_subject');
    return { success: true };
  },

  getCurrentUser: () => {
    const userJson = localStorage.getItem('edutrack_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  changePassword: async (newPassword) => {
    const response = await fetch(`${AUTH_URL}/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword })
    });
    
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Password update failed.');
    }
    
    return { success: true };
  },

  getTeacherProfileSelf: async () => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Session unauthorized');
    const response = await fetch(`${BUSINESS_URL}/teachers/profile/${user.id}`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load teacher profile.');
    if (resData.data) {
      resData.data.rawSubject = resData.data.subject;
      if (resData.data.subject === 'Science') {
        const activeSub = localStorage.getItem('active_science_subject');
        if (activeSub) {
          resData.data.subject = activeSub;
        }
      }
    }
    return resData.data;
  },

  updateTeacherProfileSelf: async (profileData) => {
    const response = await fetch(`${BUSINESS_URL}/teachers/profile/self`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to update profile.');
    return resData.data;
  },

  // =========================================================
  // 2. DASHBOARD MODULE COMPILER (ROLE ACCESS GATING)
  // =========================================================
  getDashboardData: async (role) => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Session unauthorized');

    // STUDENT ROLE COMPILER
    if (role === 'student') {
      // 1. Fetch student profile to get designated student ID
      const profileRes = await fetch(`${BUSINESS_URL}/students/profile/${user.id}`, { headers: getHeaders() });
      const profileData = await profileRes.json();
      if (!profileRes.ok || !profileData.success) throw new Error('Failed to load student profiles');
      const studentId = profileData.data.id;

      // 2. Fetch analytical academic summary report
      const reportRes = await fetch(`${BUSINESS_URL}/reports?student_id=${studentId}`, { headers: getHeaders() });
      const reportData = await reportRes.json();
      if (!reportRes.ok || !reportData.success) throw new Error('Failed to compile summary reports');

      // 3. Fetch homework count
      const homeworkRes = await fetch(`${BUSINESS_URL}/homework`, { headers: getHeaders() });
      const homeworkData = await homeworkRes.json();
      const pendingCount = (homeworkData.data || []).filter(h => h.status === 'Pending' || h.status === 'Urgent').length;

      return {
        stats: {
          attendance: { value: reportData.data.metrics.attendanceRate, label: 'Overall Attendance' },
          academicGPA: { value: reportData.data.metrics.averageMark, label: 'Average Score' },
          conductScore: { value: reportData.data.metrics.conductPoints, label: 'Conduct Points' },
          pendingTasks: { value: pendingCount, label: 'Pending Homeworks' }
        },
        recentFeedback: (reportData.data.behaviourDetails || []).slice(0, 3).map(b => ({
          title: b.title,
          text: b.description,
          points: `${b.points > 0 ? '+' : ''}${b.points} Points`,
          date: b.date
        }))
      };
    }

    // PARENT ROLE COMPILER
    if (role === 'parent') {
      // 1. Fetch parent profile to resolve linked child_id
      const profileRes = await fetch(`${BUSINESS_URL}/parents/profile/${user.id}`, { headers: getHeaders() });
      const profileData = await profileRes.json();
      if (!profileRes.ok || !profileData.success) throw new Error('Failed to load parent profiles');
      const childId = profileData.data.child_id;

      if (!childId) {
        return {
          stats: {
            childAttendance: { value: 'N/A', status: 'Pending Link', rating: 'down' },
            childLatestMark: { value: 'N/A', label: 'Average Score' },
            behaviourPoints: { value: 0, label: 'Conduct Index' },
            pendingHomework: { value: 0, label: 'Pending Assignments' }
          },
          childDetails: null,
          teacherFeedback: []
        };
      }

      // 2. Fetch linked child summary report
      const reportRes = await fetch(`${BUSINESS_URL}/reports?student_id=${childId}`, { headers: getHeaders() });
      const reportData = await reportRes.json();
      if (!reportRes.ok || !reportData.success) throw new Error('Failed to compile child report details');

      // 3. Fetch homework count
      const homeworkRes = await fetch(`${BUSINESS_URL}/homework`, { headers: getHeaders() });
      const homeworkData = await homeworkRes.json();
      const pendingCount = (homeworkData.data || []).filter(h => h.status === 'Pending' || h.status === 'Urgent').length;

      return {
        stats: {
          childAttendance: { value: reportData.data.metrics.attendanceRate, status: 'Excellent', rating: 'up' },
          childLatestMark: { value: reportData.data.metrics.averageMark, label: 'Average Score' },
          behaviourPoints: { value: reportData.data.metrics.conductPoints, label: 'Conduct Index' },
          pendingHomework: { value: pendingCount, label: 'Pending Assignments' }
        },
        childDetails: {
          name: reportData.data.studentName,
          rollNumber: reportData.data.rollNumber,
          designation: `Grade Level: ${reportData.data.className}`
        },
        teacherFeedback: (reportData.data.behaviourDetails || []).slice(0, 2).map(b => ({
          teacher: b.author?.name || 'Prof. Marcus Vance',
          subject: b.title,
          comment: b.description,
          date: b.date
        }))
      };
    }

    // TEACHER ROLE COMPILER
    if (role === 'teacher') {
      const homeworkRes = await fetch(`${BUSINESS_URL}/homework`, { headers: getHeaders() });
      const homeworkData = await homeworkRes.json();

      let teacherSubject = 'Science';
      try {
        const profileRes = await fetch(`${BUSINESS_URL}/teachers/profile/${user.id}`, { headers: getHeaders() });
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.success && profileData.data.subject) {
          teacherSubject = profileData.data.subject;
        }
      } catch (e) {
        console.warn('Fallback teacher subject', e);
      }

      return {
        stats: {
          assignedClasses: { value: 5, label: 'Active Classes' },
          todayAttendance: { value: '96.7%', label: 'Today Attendance' },
          homeworkEvaluated: { value: `${(homeworkData.data || []).filter(h => h.status === 'Graded').length}/${(homeworkData.data || []).length || 2}`, label: 'Homework Graded' },
          behaviorAlerts: { value: 0, label: 'Behavior Referrals' }
        },
        classes: [
          { id: '6A', name: 'Grade 6-A', subject: teacherSubject, strength: 28, lastAttendance: '93.8%' },
          { id: '7A', name: 'Grade 7-A', subject: teacherSubject, strength: 29, lastAttendance: '94.5%' },
          { id: '8A', name: 'Grade 8-A', subject: teacherSubject, strength: 30, lastAttendance: '95.5%' },
          { id: '9B', name: 'Grade 9-B', subject: teacherSubject, strength: 32, lastAttendance: '94.2%' },
          { id: '10A', name: 'Grade 10-A', subject: teacherSubject, strength: 28, lastAttendance: '96.7%' }
        ],
        recentActivities: [
          { id: 1, title: `Grade 10 ${teacherSubject} Quiz Graded`, desc: 'Assigned marks for Leo Sterling and 27 others.', time: '1 hour ago', category: 'success' },
          { id: 2, title: `${teacherSubject} Homework Uploaded`, desc: `Homework task posted for Grade 9-B.`, time: '3 hours ago', category: 'info' }
        ]
      };
    }

    // ADMIN ROLE COMPILER
    if (role === 'admin') {
      const complaintsRes = await fetch(`${BUSINESS_URL}/complaints`, { headers: getHeaders() });
      const complaintsData = await complaintsRes.json();

      const studentsRes = await fetch(`${BUSINESS_URL}/students`, { headers: getHeaders() });
      const studentsData = await studentsRes.json();

      const teachersRes = await fetch(`${BUSINESS_URL}/teachers`, { headers: getHeaders() });
      const teachersData = await teachersRes.json();

      const parentsRes = await fetch(`${BUSINESS_URL}/parents`, { headers: getHeaders() });
      const parentsData = parentsRes.ok ? await parentsRes.json() : { data: [] };

      return {
        stats: {
          totalStudents: { value: studentsData.data?.length || 1, change: '+4.2%', trend: 'up' },
          totalTeachers: { value: teachersData.data?.length || 1, change: '+1.5%', trend: 'up' },
          totalParents: { value: parentsData.data?.length || 1, change: '+3.1%', trend: 'up' },
          activeComplaints: { value: (complaintsData.data || []).filter(c => c.status !== 'Resolved').length, change: '-2', trend: 'down' }
        },
        attendanceToday: {
          todayRate: '96.2%',
          presentCount: 1152,
          absentCount: 48,
          byGrade: [
            { grade: 'Grade 6', present: 95.8 },
            { grade: 'Grade 7', present: 94.6 },
            { grade: 'Grade 8', present: 97.1 },
            { grade: 'Grade 9', present: 96.5 },
            { grade: 'Grade 10', present: 95.2 }
          ]
        },
        activities: [
          { id: 1, title: 'Exam Calendar Published', desc: 'Final examination timeline locked and distributed.', time: '09:30 AM', category: 'success' },
          { id: 2, title: 'Bus Route 4 Safety Resolved', desc: 'Complaint status changed to Resolved after Route division.', time: 'Yesterday', category: 'success' }
        ]
      };
    }

    return {};
  },

  // =========================================================
  // 3. ATTENDANCE MODULE SERVICES
  // =========================================================
  getAttendanceData: async (role, filters = {}) => {
    // If student or parent, fetch the attendance records JSON directly
    if (role === 'student' || role === 'parent') {
      const response = await fetch(`${BUSINESS_URL}/attendance`, { headers: getHeaders() });
      const resData = await response.json();
      if (!response.ok || !resData.success) throw new Error('Failed to load attendance logs.');
      
      // attendance service returns { records, summary }
      return resData.data;
    }

    // Faculty live attendance loader
    if (role === 'teacher') {
      // 1. Fetch student list
      const studentsRes = await fetch(`${BUSINESS_URL}/students`, { headers: getHeaders() });
      const studentsData = await studentsRes.json();
      if (!studentsRes.ok || !studentsData.success) throw new Error('Failed to fetch student register.');
      const students = studentsData.data || [];

      // 2. Fetch attendance logs for selected date (defaults to today's date if unspecified)
      const targetDate = filters.date || (() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })();
      const attendanceRes = await fetch(`${BUSINESS_URL}/attendance?date=${targetDate}`, { headers: getHeaders() });
      const attendanceData = await attendanceRes.json();
      const attendanceLogs = (attendanceData.success && attendanceData.data?.records) || [];

      // Map students to their attendance status for that date
      const records = students.map(s => {
        const log = attendanceLogs.find(a => a.student_id === s.id);
        return {
          student_id: s.id,
          rollNo: s.roll_number.split('-').pop(),
          name: s.name,
          status: log ? log.status : '', // Maintain blank for new days
          address: s.address || '',
          phone: s.phone || '',
          class_id: s.class_id
        };
      });

      const presentCount = records.filter(r => r.status === 'Present').length;
      const absentCount = records.filter(r => r.status === 'Absent').length;
      const totalCount = records.length;
      const classRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 100;

      return {
        classAttendance: `${classRate}%`,
        present: presentCount,
        absent: absentCount,
        records
      };
    }

    // Admin: compute real-time stats from the actual attendance database
    if (role === 'admin') {
      const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      })();
      const attendanceRes = await fetch(`${BUSINESS_URL}/attendance?date=${today}`, { headers: getHeaders() });
      const attendanceData = await attendanceRes.json();
      const todayLogs = (attendanceData.success && attendanceData.data?.records) || [];

      const studentsRes = await fetch(`${BUSINESS_URL}/students`, { headers: getHeaders() });
      const studentsData = await studentsRes.json();
      const allStudents = (studentsData.success && studentsData.data) || [];

      const presentCount = todayLogs.filter(r => r.status === 'Present').length;
      const absentCount = todayLogs.filter(r => r.status === 'Absent').length;
      const totalCount = allStudents.length || 1;
      const todayRate = todayLogs.length > 0
        ? `${((presentCount / todayLogs.length) * 100).toFixed(1)}%`
        : 'No Data';

      return {
        todayRate,
        presentCount,
        absentCount,
        totalStudents: totalCount,
        byGrade: [
          { grade: 'Grade 6', classId: 'class-6a' },
          { grade: 'Grade 7', classId: 'class-7a' },
          { grade: 'Grade 8', classId: 'class-8a' },
          { grade: 'Grade 9', classId: 'class-9a' },
          { grade: 'Grade 10', classId: 'c1111111-1111-1111-1111-111111111111' }
        ].map(g => {
          const gradeStudents = allStudents.filter(s => s.class_id === g.classId);
          const gradeLogs = todayLogs.filter(l => gradeStudents.some(s => s.id === l.student_id));
          const gradePresent = gradeLogs.filter(l => l.status === 'Present').length;
          const pct = gradeLogs.length > 0 ? Number(((gradePresent / gradeLogs.length) * 100).toFixed(1)) : 0;
          return { grade: g.grade, present: pct, presentCount: gradePresent, total: gradeStudents.length };
        })
      };
    }

    return {};
  },

  postStudentAttendance: async (attendanceData) => {
    const response = await fetch(`${BUSINESS_URL}/attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(attendanceData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to record attendance.');
    return resData.data;
  },

  postBulkAttendance: async (records) => {
    // Send requests sequentially to avoid race conditions on the mock DB
    const results = [];
    for (const r of records) {
      const res = await fetch(`${BUSINESS_URL}/attendance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(r)
      });
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.message || `Failed to save attendance for student ${r.student_id}`);
      }
      results.push(resData.data);
    }
    return { success: true, saved: results.length };
  },

  // =========================================================
  // 4. MARKS MODULE SERVICES
  // =========================================================
  getMarksData: async (studentId = 'student', subject = '') => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Session unauthorized');

    if (user.role === 'teacher' || user.role === 'admin') {
      // 1. Fetch all marks
      const marksRes = await fetch(`${BUSINESS_URL}/marks`, { headers: getHeaders() });
      const marksData = await marksRes.json();
      if (!marksRes.ok || !marksData.success) throw new Error('Failed to load student grade sheets.');
      const marksList = marksData.data || [];

      // 2. Fetch all students dynamically
      const studentsRes = await fetch(`${BUSINESS_URL}/students`, { headers: getHeaders() });
      const studentsData = await studentsRes.json();
      if (!studentsRes.ok || !studentsData.success) throw new Error('Failed to load active pupil records.');
      const studentsList = studentsData.data || [];

      // 3. Resolve the active subject
      let targetSubject = subject;
      if (!targetSubject) {
        if (user.role === 'teacher') {
          try {
            const profileRes = await fetch(`${BUSINESS_URL}/teachers/profile/${user.id}`, { headers: getHeaders() });
            const profileData = await profileRes.json();
            if (profileRes.ok && profileData.success && profileData.data.subject) {
              targetSubject = profileData.data.subject;
            }
          } catch (e) {
            console.warn('Fallback teacher subject', e);
          }
        }
        if (!targetSubject) targetSubject = 'Telugu';
      }

      // 4. Map each active student to a grade entry.
      // Filter out Sports since it does not have examinations.
      if (targetSubject === 'Sports') {
        return {
          totalMarks: 0,
          maxMarks: 0,
          percentage: 'N/A',
          grade: 'N/A',
          summary: [],
          subjectAverages: []
        };
      }

      const mappedMarks = studentsList.map(student => {
        const studentSubjectMarks = marksList.filter(m => m.student_id === student.id && m.subject === targetSubject);
        
        // Find Annual Exam as the main one
        let mainMark = studentSubjectMarks.find(m => m.type === 'Annual Exam');
        const internals = studentSubjectMarks.filter(m => m.type !== 'Annual Exam');
        
        if (mainMark) {
          return {
            id: mainMark.id,
            student_id: student.id,
            studentName: student.name,
            rollNumber: student.roll_number,
            subject: targetSubject,
            type: 'Annual Exam',
            score: mainMark.score,
            max: mainMark.max_score || 100,
            grade: mainMark.score >= 90 ? 'A+' : mainMark.score >= 80 ? 'A' : mainMark.score >= 70 ? 'B' : 'C',
            date: mainMark.date,
            teacher: 'Prof. Marcus Vance',
            internals: internals
          };
        } else {
          return {
            id: `temp-${student.id}`,
            student_id: student.id,
            studentName: student.name,
            rollNumber: student.roll_number,
            subject: targetSubject,
            type: 'Annual Exam',
            score: '0',
            max: 100,
            grade: 'F',
            date: '-',
            teacher: 'Prof. Marcus Vance',
            isPlaceholder: true, // Flag to show "Not Graded" on UI!
            internals: internals
          };
        }
      });

      const totalScore = mappedMarks.reduce((sum, m) => sum + Number(m.score), 0);
      const maxScore = mappedMarks.length * 100;
      const avgPercentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '100';

      return {
        totalMarks: totalScore,
        maxMarks: maxScore,
        percentage: `${avgPercentage}%`,
        grade: Number(avgPercentage) >= 75 ? 'Distinction' : 'Passed',
        summary: mappedMarks,
        subjectAverages: [
          { subject: 'Telugu', score: 85 },
          { subject: 'Hindi', score: 82 },
          { subject: 'English', score: 88 },
          { subject: 'Mathematics', score: 92 },
          { subject: 'Science', score: 84 },
          { subject: 'Social Studies', score: 86 }
        ]
      };
    }

    let sid = studentId;

    if (studentId === 'student') {
      const profileRes = await fetch(`${BUSINESS_URL}/students/profile/${user.id}`, { headers: getHeaders() });
      const profileData = await profileRes.json();
      if (!profileRes.ok || !profileData.success) throw new Error('Failed to resolve student profile.');
      sid = profileData.data.id;
    }

    const response = await fetch(`${BUSINESS_URL}/reports?student_id=${sid}`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to resolve student mark ledger.');

    const data = resData.data;

    const groupedSummary = [];
    const subjectsWithExams = ['Telugu', 'Hindi', 'English', 'Mathematics', 'Biology', 'Physics', 'Social Studies'];
    
    subjectsWithExams.forEach(subj => {
      const subjectMarks = (data.academicDetails || []).filter(m => m.subject === subj);
      if (subjectMarks.length > 0) {
        let mainMark = subjectMarks.find(m => m.type === 'Annual Exam');
        if (!mainMark) {
          mainMark = subjectMarks[0];
        }
        const internals = subjectMarks.filter(m => m.id !== mainMark.id);
        
        groupedSummary.push({
          subject: subj,
          type: mainMark.type,
          score: mainMark.score,
          max: mainMark.max_score || 100,
          grade: mainMark.score >= 90 ? 'A+' : mainMark.score >= 80 ? 'A' : mainMark.score >= 70 ? 'B' : 'C',
          date: mainMark.date,
          teacher: mainMark.subject === 'Mathematics' ? 'Prof. Marcus Vance' : 'Dr. Sarah Connor',
          details: mainMark.subject === 'Science' ? `Biology: ${mainMark.biology_score}/50, Physics: ${mainMark.physics_score}/50` : undefined,
          internals: internals
        });
      }
    });

    const totalScore = groupedSummary.reduce((sum, m) => sum + Number(m.score), 0);
    const maxScore = groupedSummary.length * 100;

    return {
      totalMarks: totalScore,
      maxMarks: maxScore,
      percentage: data.metrics.averageMark,
      grade: data.metrics.overallResult,
      summary: groupedSummary,
      subjectAverages: groupedSummary.map(m => ({
        subject: m.subject,
        score: m.score
      }))
    };
  },

  listStudents: async () => {
    const response = await fetch(`${BUSINESS_URL}/students`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to retrieve student register.');
    return resData.data;
  },

  listTeachers: async () => {
    const response = await fetch(`${BUSINESS_URL}/teachers`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to retrieve teacher register.');
    return resData.data;
  },

  createTeacher: async (teacherData) => {
    const response = await fetch(`${BUSINESS_URL}/teachers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(teacherData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to create teacher.');
    return resData.data;
  },

  createStudent: async (studentData) => {
    const response = await fetch(`${BUSINESS_URL}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to create student.');
    return resData.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await fetch(`${BUSINESS_URL}/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to update student.');
    return resData.data;
  },

  deleteTeacher: async (id) => {
    const response = await fetch(`${BUSINESS_URL}/teachers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to remove teacher.');
    return resData.data;
  },

  deleteStudent: async (id) => {
    const response = await fetch(`${BUSINESS_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to remove student.');
    return resData.data;
  },

  postStudentMark: async (markData) => {
    const response = await fetch(`${BUSINESS_URL}/marks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(markData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to record grade.');
    return resData.data;
  },

  // =========================================================
  // 5. BEHAVIOUR MODULE SERVICES
  // =========================================================
  getBehaviourData: async (studentId = '') => {
    const url = studentId ? `${BUSINESS_URL}/behaviour?student_id=${studentId}` : `${BUSINESS_URL}/behaviour`;
    const response = await fetch(url, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to fetch behaviour comments.');

    return {
      points: resData.data.points,
      positiveCount: (resData.data.records || []).filter(r => r.type === 'positive').length,
      negativeCount: (resData.data.records || []).filter(r => r.type === 'negative').length,
      observations: (resData.data.records || []).map(r => ({
        id: r.id,
        date: r.date,
        type: r.type,
        title: r.title,
        desc: r.description,
        author: r.authorName || r.author?.name || 'Mrs. Emily Davis',
        studentName: r.studentName,
        studentClass: r.studentClass
      }))
    };
  },

  createBehaviourReport: async (reportData) => {
    const response = await fetch(`${BUSINESS_URL}/behaviour`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to record behavior observation.');
    return resData.data;
  },

  deleteBehaviourReport: async (id) => {
    const response = await fetch(`${BUSINESS_URL}/behaviour/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to delete behavior observation.');
    return resData.data;
  },

  getBehaviourSpotlight: async () => {
    const response = await fetch(`${BUSINESS_URL}/behaviour?spotlight=true`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to fetch behavior spotlight.');
    return (resData.data.records || []).map(r => ({
      date: r.date,
      type: r.type,
      title: r.title,
      desc: r.description,
      author: r.authorName || 'Mrs. Emily Davis',
      studentName: r.studentName,
      studentClass: r.studentClass
    }));
  },

  // =========================================================
  // 6. COMPLAINTS MODULE CRUD
  // =========================================================
  getComplaints: async () => {
    const response = await fetch(`${BUSINESS_URL}/complaints`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load complaints registry.');
    return resData.data;
  },

  createComplaint: async (complaintData) => {
    const response = await fetch(`${BUSINESS_URL}/complaints`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(complaintData)
    });
    
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to submit complaint.');
    }
    return resData;
  },

  updateComplaintStatus: async (id, status, responseText = '') => {
    const response = await fetch(`${BUSINESS_URL}/complaints/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, response: responseText })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Failed to update complaint status.');
    }
    return resData;
  },

  // =========================================================
  // 7. HOMEWORK MODULE SERVICES
  // =========================================================
  getHomework: async () => {
    const response = await fetch(`${BUSINESS_URL}/homework`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to fetch homework registry.');
    return resData.data;
  },

  submitHomework: async (homeworkId) => {
    const response = await fetch(`${BUSINESS_URL}/homework/${homeworkId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status: 'Submitted' })
    });
    
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to submit homework assignment.');
    return resData;
  },

  postHomework: async (homeworkData) => {
    const response = await fetch(`${BUSINESS_URL}/homework`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(homeworkData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to assign homework.');
    return resData.data;
  },

  // =========================================================
  // 8. ANNOUNCEMENTS BOARD SERVICES
  // =========================================================
  getAnnouncements: async () => {
    const response = await fetch(`${BUSINESS_URL}/announcements`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to retrieve announcements notices.');
    return resData.data;
  },

  createAnnouncement: async (announcementData) => {
    const response = await fetch(`${BUSINESS_URL}/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(announcementData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to create announcement.');
    return resData.data;
  },

  updateAnnouncement: async (id, announcementData) => {
    const response = await fetch(`${BUSINESS_URL}/announcements/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(announcementData)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to update announcement.');
    return resData.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await fetch(`${BUSINESS_URL}/announcements/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to delete announcement.');
    return resData.data;
  },

  // =========================================================
  // 9. NOTIFICATIONS BOARD SERVICES
  // =========================================================
  getNotifications: async () => {
    const response = await fetch(`${BUSINESS_URL}/notifications`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load system notifications.');
    
    // Map database created_at timestamp back to time description formats expected in UI
    return (resData.data || []).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      text: n.text,
      time: 'Just now',
      read: n.read
    }));
  },

  markNotificationsAsRead: async () => {
    const response = await fetch(`${BUSINESS_URL}/notifications/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to clear alert inboxes.');
    return resData;
  },

  sendNotification: async (payload) => {
    const response = await fetch(`${BUSINESS_URL}/notifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to dispatch notification.');
    return resData.data;
  },

  getTimetableData: async () => {
    const response = await fetch(`${BUSINESS_URL}/timetable`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to retrieve timetable config.');
    return resData.data;
  },

  saveTimetableData: async (payload) => {
    const response = await fetch(`${BUSINESS_URL}/timetable/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to save timetable configuration.');
    return resData.data;
  },

  lockAttendanceDate: async (payload) => {
    const response = await fetch(`${BUSINESS_URL}/timetable/lock-attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to lock attendance date.');
    return resData.data;
  },

  unlockAttendanceDate: async (payload) => {
    const response = await fetch(`${BUSINESS_URL}/timetable/unlock-attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to unlock attendance date.');
    return resData.data;
  },

  // =========================================================
  // 10. PROFILE & CONFIG SERVICES
  // =========================================================
  updateProfile: async (role, updatedData) => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Unauthenticated user settings profile update attempt.');

    let endpoint = `${BUSINESS_URL}/students/${user.id}`;
    if (role === 'teacher') endpoint = `${BUSINESS_URL}/teachers/${user.id}`;
    if (role === 'parent') endpoint = `${BUSINESS_URL}/parents/${user.id}`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedData)
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to update student settings profiles.');

    const newUser = { ...user, ...updatedData };
    localStorage.setItem('edutrack_user', JSON.stringify(newUser));
    return { success: true, profile: newUser };
  },

  getStudentProfileSelf: async () => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Session unauthorized');
    const response = await fetch(`${BUSINESS_URL}/students/profile/${user.id}`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load student profile.');
    return resData.data;
  },

  getParentProfileSelf: async () => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Session unauthorized');
    const response = await fetch(`${BUSINESS_URL}/parents/profile/${user.id}`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load parent profile.');
    return resData.data;
  },

  verifyChild: async (payload) => {
    const response = await fetch(`${BUSINESS_URL}/parents/verify-child`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Verification failed.');
    }
    return resData;
  },

  verifyStudentProfile: async (payload) => {
    const response = await fetch(`${BUSINESS_URL}/students/verify-profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Verification failed.');
    }
    return resData;
  },

  // =========================================================
  // 9. PROMOTION MANAGEMENT SERVICES
  // =========================================================
  promoteStudent: async (studentId, targetClassId, academicYear) => {
    const response = await fetch(`${BUSINESS_URL}/promotions/promote-student`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ student_id: studentId, new_class_id: targetClassId, academic_year: academicYear })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to promote student.');
    return resData;
  },

  promoteClass: async (sourceClassId, targetClassId, academicYear) => {
    const response = await fetch(`${BUSINESS_URL}/promotions/promote-class`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ source_class_id: sourceClassId, target_class_id: targetClassId, academic_year: academicYear })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to promote class.');
    return resData;
  },

  completeSchoolingStudents: async (studentIds, academicYear) => {
    const response = await fetch(`${BUSINESS_URL}/promotions/complete-schooling`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ student_ids: studentIds, academic_year: academicYear })
    });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.message || 'Failed to complete schooling for student(s).');
    return resData;
  },

  getPromotionHistory: async () => {
    const response = await fetch(`${BUSINESS_URL}/promotions/history`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load promotion history.');
    return resData.data;
  },

  getPastPerformance: async (studentId) => {
    const response = await fetch(`${BUSINESS_URL}/promotions/past-performance?student_id=${studentId}`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load past performance records.');
    return resData.data;
  },

  getActiveStudents: async () => {
    const response = await fetch(`${BUSINESS_URL}/promotions/active-students`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load active students.');
    return resData.data;
  },

  getCompletedSchoolingStudents: async () => {
    const response = await fetch(`${BUSINESS_URL}/promotions/completed-schooling-students`, { headers: getHeaders() });
    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error('Failed to load completed schooling students.');
    return resData.data;
  }
};

export default api;
