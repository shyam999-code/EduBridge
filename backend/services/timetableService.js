const mockDb = require('../database/mockDb');

const timetableService = {
  getTimetable: async () => {
    const mappedTeachers = (mockDb.teachers || []).map(t => {
      const u = (mockDb.users || []).find(usr => usr.id === t.user_id);
      return {
        id: t.id,
        name: u ? u.name : 'Unknown Teacher',
        subject: t.subject,
        phone: t.phone || 'N/A'
      };
    });
    return {
      ...mockDb.timetable,
      classes: mockDb.classes || [],
      teachers: mappedTeachers
    };
  },

  saveTimetable: async (timetableData, requester) => {
    if (requester && requester.role !== 'admin') {
      throw { status: 403, code: 'FORBIDDEN', message: 'Only administrators are permitted to configure class timetables.' };
    }

    // Initialize if absent
    if (!mockDb.timetable) {
      mockDb.timetable = {};
    }

    // Configure working days
    if (timetableData.workingDays) {
      mockDb.timetable.workingDays = timetableData.workingDays;
    }

    // Configure period timings
    if (timetableData.periodTimings) {
      mockDb.timetable.periodTimings = timetableData.periodTimings;
    }

    // Assign class teachers
    if (timetableData.classTeachers) {
      // Validate that only one class teacher is assigned per class
      const seenClasses = new Set();
      for (const ct of timetableData.classTeachers) {
        if (seenClasses.has(ct.classId)) {
          throw { status: 400, message: `Validation Error: Only one class teacher can be assigned per class.` };
        }
        seenClasses.add(ct.classId);
      }
      mockDb.timetable.classTeachers = timetableData.classTeachers;
    }

    // Configure attendance responsibility
    if (timetableData.hasOwnProperty('attendanceResponsibilityEnabled')) {
      mockDb.timetable.attendanceResponsibilityEnabled = timetableData.attendanceResponsibilityEnabled;
    }

    // Save schedules and enforce First Period Rule
    if (timetableData.schedule) {
      mockDb.timetable.schedule = timetableData.schedule.map(lesson => {
        // Find Class Teacher for this class
        const classTeacher = (mockDb.timetable.classTeachers || []).find(ct => ct.classId === lesson.classId);
        
        // If it's Period 1, automatically force the teacher to be the Class Teacher
        if (lesson.periodId === 'p1') {
          if (!classTeacher || !classTeacher.teacherId) {
            throw { status: 400, message: `Validation Error: Cannot schedule Period 1 for class '${lesson.classId}' without an assigned Class Teacher.` };
          }
          return {
            ...lesson,
            teacherId: classTeacher.teacherId
          };
        }
        return lesson;
      });
    }

    mockDb.saveToDisk();
    return mockDb.timetable;
  },

  lockAttendance: async (classId, date) => {
    if (!mockDb.timetable) {
      mockDb.timetable = { lockedDates: [] };
    }
    if (!mockDb.timetable.lockedDates) {
      mockDb.timetable.lockedDates = [];
    }

    const exists = mockDb.timetable.lockedDates.some(l => l.classId === classId && l.date === date);
    if (!exists) {
      mockDb.timetable.lockedDates.push({ classId, date });
      mockDb.saveToDisk();
    }
    return mockDb.timetable;
  },

  unlockAttendance: async (classId, date) => {
    if (mockDb.timetable && mockDb.timetable.lockedDates) {
      mockDb.timetable.lockedDates = mockDb.timetable.lockedDates.filter(l => !(l.classId === classId && l.date === date));
      mockDb.saveToDisk();
    }
    return mockDb.timetable;
  }
};

module.exports = timetableService;
