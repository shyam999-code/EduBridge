const studentService = require('./studentService');
const attendanceService = require('./attendanceService');
const marksService = require('./marksService');
const behaviourService = require('./behaviourService');

const reportService = {
  getStudentSummaryReport: async (studentId, requester) => {
    // 1. Fetch student basic profile
    const profile = await studentService.getStudentProfile(studentId, requester);

    // 2. Fetch attendance logs and summary
    const attendance = await attendanceService.getAttendance({ student_id: studentId }, requester);

    // 3. Fetch marks and academic performance breakdown
    const marksReport = await marksService.getStudentReport(studentId, requester);

    // 4. Fetch conduct behaviour index and history
    const behaviour = await behaviourService.getBehaviourReports({ student_id: studentId }, requester);

    return {
      studentId,
      studentName: profile.user ? profile.user.name : 'Unknown Student',
      rollNumber: profile.roll_number,
      className: profile.class ? profile.class.name : 'Unassigned',
      metrics: {
        attendanceRate: attendance.summary ? `${attendance.summary.percentage}%` : 'N/A',
        attendancePresent: attendance.summary ? attendance.summary.present : 0,
        attendanceAbsent: attendance.summary ? attendance.summary.absent : 0,
        averageMark: marksReport.percentage,
        overallResult: marksReport.resultStatus,
        conductPoints: behaviour.points
      },
      attendanceDetails: attendance.records.slice(0, 10), // return last 10 logs
      academicDetails: marksReport.subjectBreakdown,
      behaviourDetails: behaviour.records
    };
  }
};

module.exports = reportService;
