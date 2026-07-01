const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'mockDb.json');

// Generate a year of mock attendance for the mock student
const generateStudentAttendance = () => {
  const records = [];
  const startDate = new Date(2025, 5, 1);
  const endDate = new Date(2026, 5, 1);
  const reasons = ['Medical Leave', 'Family Emergency', 'Severe Weather', 'Dental Appointment'];

  let curr = new Date(startDate);
  while (curr <= endDate) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) {
      const isAbsent = Math.random() < 0.05;
      const dateStr = curr.toISOString().split('T')[0];
      if (isAbsent) {
        records.push({
          id: `att-${Math.random().toString(36).substr(2, 9)}`,
          student_id: 'e1111111-1111-1111-1111-111111111111',
          date: dateStr,
          status: 'Absent',
          check_in: '-',
          remarks: reasons[Math.floor(Math.random() * reasons.length)]
        });
      } else {
        records.push({
          id: `att-${Math.random().toString(36).substr(2, 9)}`,
          student_id: 'e1111111-1111-1111-1111-111111111111',
          date: dateStr,
          status: 'Present',
          check_in: '07:45 AM',
          remarks: 'On time'
        });
      }
    }
    curr.setDate(curr.getDate() + 1);
  }
  return records;
};

const defaultDb = {
  users: [
    { id: 'admin-uuid-1001', name: 'Dr. Evelyn Carter', email: 'admin@edubridge.com', role: 'admin', status: 'active', password_hash: '$2a$10$7bG6WUn9hM36BMEsYHdZ1u3TPm.UUy0..GpiFCtjyYSqUlpl.7yAK' },
    { id: 'superadmin-uuid-9999', name: 'Super Admin', email: 'edubridgeadmin1@gmail.com', role: 'admin', status: 'active', password_hash: '$2a$10$7bG6WUn9hM36BMEsYHdZ1u3TPm.UUy0..GpiFCtjyYSqUlpl.7yAK' },
    { id: 'teacher-uuid-2002', name: 'Prof. Marcus Vance', email: 'teacher@edubridge.com', role: 'teacher', status: 'active' },
    { id: 'student-uuid-4004', name: 'Leo Sterling', email: 'student@edubridge.com', role: 'student', status: 'active' },
    { id: 'parent-uuid-3003', name: 'Robert Sterling', email: 'parent@edubridge.com', role: 'parent', status: 'active' },
    { id: 'student-uuid-clara', name: 'Clara Jenkins', email: 'clara@edubridge.com', role: 'student', status: 'active' },
    { id: 'student-uuid-olivia', name: 'Olivia Vance', email: 'olivia@edubridge.com', role: 'student', status: 'active' }
  ],
  students: [
    { id: 'e1111111-1111-1111-1111-111111111111', user_id: 'student-uuid-4004', roll_number: 'ET-2026-1042', class_id: 'c1111111-1111-1111-1111-111111111111', address: '404 Oakwood Lane, Crestview', phone: '+1 (555) 012-7489', date_of_birth: '2006-01-15' },
    { id: 'student-clara-id', user_id: 'student-uuid-clara', roll_number: 'ET-2026-1002', class_id: 'c1111111-1111-1111-1111-111111111111', address: '129 Birchwood Avenue, Riverdale', phone: '+1 (555) 014-9822', date_of_birth: '2006-02-20' },
    { id: 'student-olivia-id', user_id: 'student-uuid-olivia', roll_number: 'ET-2026-1005', class_id: 'c1111111-1111-1111-1111-111111111111', address: '782 Pinecrest Blvd, Hillsboro', phone: '+1 (555) 019-2831', date_of_birth: '2006-03-25' }
  ],
  teachers: [
    { id: 'd1111111-1111-1111-1111-111111111111', user_id: 'teacher-uuid-2002', subject: 'Mathematics', designation: 'Senior Mathematics & Physics Tutor', address: '128 Birchwood Avenue, Riverdale', phone: '+1 (555) 014-9821' }
  ],
  parents: [
    { id: 'f1111111-1111-1111-1111-111111111111', user_id: 'parent-uuid-3003', child_id: 'e1111111-1111-1111-1111-111111111111', designation: 'Chief Architect, Sterling Design', address: '404 Oakwood Lane, Crestview', phone: '+1 (555) 017-4839' }
  ],
  classes: [
    { id: 'class-6a', name: 'Grade 6-A', grade_level: 'Grade 6', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'class-7a', name: 'Grade 7-A', grade_level: 'Grade 7', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'class-8a', name: 'Grade 8-A', grade_level: 'Grade 8', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'class-9a', name: 'Grade 9-A', grade_level: 'Grade 9', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'c1111111-1111-1111-1111-111111111111', name: 'Grade 10-A', grade_level: 'Grade 10', teacher_id: 'd1111111-1111-1111-1111-111111111111' }
  ],
  attendance: [],
  marks: [
    { id: 'm-1', student_id: 'e1111111-1111-1111-1111-111111111111', subject: 'Telugu', score: 92, max_score: 100, type: 'Annual Exam', date: '2026-05-22', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'm-2', student_id: 'e1111111-1111-1111-1111-111111111111', subject: 'Hindi', score: 85, max_score: 100, type: 'Annual Exam', date: '2026-05-20', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'm-3', student_id: 'e1111111-1111-1111-1111-111111111111', subject: 'English', score: 88, max_score: 100, type: 'Annual Exam', date: '2026-05-18', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'm-4', student_id: 'e1111111-1111-1111-1111-111111111111', subject: 'Mathematics', score: 96, max_score: 100, type: 'Annual Exam', date: '2026-05-15', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'm-5', student_id: 'e1111111-1111-1111-1111-111111111111', subject: 'Science', score: 89, max_score: 100, biology_score: 44, physics_score: 45, type: 'Annual Exam', date: '2026-05-12', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'm-6', student_id: 'e1111111-1111-1111-1111-111111111111', subject: 'Social Studies', score: 88, max_score: 100, type: 'Annual Exam', date: '2026-05-10', teacher_id: 'd1111111-1111-1111-1111-111111111111' }
  ],
  homework: [
    { id: 'HW-801', class_id: 'c1111111-1111-1111-1111-111111111111', subject: 'Mathematics', chapter_name: 'Quadratic & Exponential Equations', completion_day: 'Thursday', details: 'Complete textbook exercise problems.', due_date: '2026-06-04', status: 'Pending', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'HW-802', class_id: 'c1111111-1111-1111-1111-111111111111', subject: 'Science', chapter_name: 'Electromagnetic Field Calculations', completion_day: 'Tuesday', details: 'Solve laboratory equations sheet.', due_date: '2026-06-02', status: 'Urgent', teacher_id: 'd1111111-1111-1111-1111-111111111111' }
  ],
  behaviour_reports: [
    { id: 'b-1', student_id: 'e1111111-1111-1111-1111-111111111111', type: 'positive', title: 'Exceptional Peer Mentoring', description: 'Leo helped three students who were struggling to understand calculus.', points: 10, date: '2026-05-26', author_id: 'teacher-uuid-2002' },
    { id: 'b-2', student_id: 'e1111111-1111-1111-1111-111111111111', type: 'negative', title: 'Unprepared for Class', description: 'Arrived for physics lecture without the assigned textbook.', points: -5, date: '2026-05-09', author_id: 'teacher-uuid-2002' },
    { id: 'b-3', student_id: 'student-clara-id', type: 'positive', title: 'Community Outreach Leadership', description: 'Clara organized a class charity drive for the local community shelter, raising significant donations.', points: 15, date: '2026-05-28', author_id: 'teacher-uuid-2002' },
    { id: 'b-4', student_id: 'student-olivia-id', type: 'positive', title: 'Cooperative Laboratory Support', description: 'Olivia stayed after class to clean and prepare laboratory science instruments, assisting peers.', points: 10, date: '2026-05-27', author_id: 'teacher-uuid-2002' }
  ],
  complaints: [
    { id: 'CPL-102', title: 'Inconsistent School Portal Performance', description: 'The student login page takes an exceptionally long time to load during peak morning hours.', status: 'Pending', response: '', date: '2026-05-27', submitted_by: 'student-uuid-4004', student_id: 'e1111111-1111-1111-1111-111111111111' }
  ],
  announcements: [
    { id: 'ANN-301', title: 'Annual Science Exhibition 2026', content: 'We are thrilled to announce our Annual Science Fair on June 15th.', type: 'event', date: '2026-05-29', author_name: 'Dr. Evelyn Carter' },
    { id: 'ANN-302', title: 'Final Term Exam Schedule Released', content: 'The final examinations for the academic session 2025-2026 will commence on June 18th.', type: 'urgent', date: '2026-05-25', author_name: 'Principal Office' }
  ],
  notifications: [
    { id: 'NTF-01', user_id: 'student-uuid-4004', type: 'alert', title: 'New Physics Homework Assigned', text: 'Prof. Marcus Vance assigned homework. Due in 24 hours.', read: false, created_at: new Date() }
  ]
};

// Self-healing seed generator for 40 realistic students and marks in Latha's Telugu class
const seedRealisticClass = (db) => {
  if (!db.students) db.students = [];
  if (!db.users) db.users = [];
  if (!db.marks) db.marks = [];
  if (!db.attendance) db.attendance = [];

  const existingGrade10A = db.students.filter(s => s.class_id === 'c1111111-1111-1111-1111-111111111111');
  if (existingGrade10A.length >= 35) {
    return; // Already seeded
  }

  const names = [
    'Aravind Rao', 'Bhanu Prasad', 'Charan Teja', 'Dinesh Kumar', 'Eshwar Reddy',
    'Ganesh Naidu', 'Hari Krishna', 'Indra Sena', 'Jeevan Kumar', 'Karthik Raja',
    'Lokesh Babu', 'Manoj Kumar', 'Naveen Chandra', 'Pranav Reddy', 'Rahul Verma',
    'Sanjay Dutt', 'Tarun Tej', 'Uday Kiran', 'Vijay Kumar', 'Yashwanth Rao',
    'Abhinav Sastry', 'Bharath Ram', 'Chaitanya Krishna', 'Deepak Reddy', 'Goutham Naidu',
    'Hemant Kumar', 'Kalyan Chakravarthy', 'Madhav Rao', 'Pradeep Kumar', 'Rajesh Gopal',
    'Suresh Raina', 'Vikram Aditya', 'Anil Kapoor', 'Sunil Dutt', 'Kiran Kumar',
    'Pavan Kalyan'
  ];

  names.forEach((name, idx) => {
    const sId = `std-seed-${idx + 1}`;
    const uId = `usr-seed-${idx + 1}`;
    const rollNo = `ET-2026-24L31A0${500 + idx}`;

    if (!db.users.some(u => u.id === uId)) {
      db.users.push({
        id: uId,
        name: name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@edubridge.com`,
        role: 'student',
        status: 'active',
        password_hash: '$2a$10$gbis77QUuhkJ1PEURwn/WOBOQoGuwHHgA62MVoDKnwYCSlH/EiRny' // password123
      });
    }

    if (!db.students.some(s => s.id === sId)) {
      db.students.push({
        id: sId,
        user_id: uId,
        roll_number: rollNo,
        class_id: 'c1111111-1111-1111-1111-111111111111',
        address: '505 Jubilee Hills, Hyderabad',
        phone: `+91 99887766${String(idx).padStart(2, '0')}`,
        name: name,
        date_of_birth: `2006-05-${String(idx + 1).padStart(2, '0')}`
      });
    }

    // Determine Telugu Mark
    // We want 12 High Performers (>75), 6 Failed (<50), and the rest (22) Average (50-75)
    // There are 36 students in names array.
    // Index 0 to 10: High Performers (11 students) + Saketh (existing) = 12 total
    // Index 11 to 16: Failed (6 students)
    // Index 17 to 35: Average (19 students) + Clara, Olivia, Raju (existing) = 22 total
    let score = 65;
    if (idx < 11) {
      score = 76 + (idx * 2);
    } else if (idx < 17) {
      score = 32 + ((idx - 11) * 3);
    } else {
      score = 50 + ((idx - 17) * 1);
    }

    const mId = `m-seed-${idx + 1}`;
    if (!db.marks.some(m => m.id === mId)) {
      db.marks.push({
        id: mId,
        student_id: sId,
        subject: 'Telugu',
        score: score,
        max_score: 100,
        type: 'Annual Exam',
        date: '2026-05-22',
        teacher_id: 'tch-uuidlatha'
      });
    }

    const mMathId = `m-seed-math-${idx + 1}`;
    if (!db.marks.some(m => m.id === mMathId)) {
      db.marks.push({
        id: mMathId,
        student_id: sId,
        subject: 'Mathematics',
        score: score,
        max_score: 100,
        type: 'Annual Exam',
        date: '2026-05-22',
        teacher_id: 'd1111111-1111-1111-1111-111111111111'
      });
    }

    // Index 11, 13, 15 failed students will have low attendance (<75%)
    const attendanceRate = (idx < 11) ? 0.94 : (idx < 17 ? (idx % 2 === 1 ? 0.62 : 0.88) : 0.84);
    for (let dayNum = 1; dayNum <= 15; dayNum++) {
      const isAbsent = Math.random() > attendanceRate;
      const dateStr = `2026-05-${String(dayNum).padStart(2, '0')}`;
      const attId = `att-seed-${idx + 1}-${dayNum}`;
      if (!db.attendance.some(a => a.id === attId)) {
        db.attendance.push({
          id: attId,
          student_id: sId,
          date: dateStr,
          status: isAbsent ? 'Absent' : 'Present',
          check_in: isAbsent ? '-' : '07:45 AM',
          remarks: isAbsent ? 'Medical Leave' : 'On time'
        });
      }
    }
  });

  const existingStudents = ['e1111111-1111-1111-1111-111111111111', 'student-clara-id', 'student-olivia-id', 'std-uuidraju'];
  existingStudents.forEach((sId, idx) => {
    for (let dayNum = 1; dayNum <= 15; dayNum++) {
      const attId = `att-seed-exist-${idx}-${dayNum}`;
      if (!db.attendance.some(a => a.id === attId)) {
        db.attendance.push({
          id: attId,
          student_id: sId,
          date: `2026-05-${String(dayNum).padStart(2, '0')}`,
          status: 'Present',
          check_in: '07:45 AM',
          remarks: 'On time'
        });
      }
    }
  });
};

let mockDb = null;

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    mockDb = JSON.parse(raw);
    console.log('Loaded mock database state from persistent file:', DB_FILE);
  } catch (err) {
    console.error('Failed to parse persistent mock database file:', err);
  }
}

if (!mockDb || !mockDb.users) {
  mockDb = defaultDb;
  mockDb.attendance = generateStudentAttendance();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDb, null, 2), 'utf8');
    console.log('Initialized new persistent mock database file:', DB_FILE);
  } catch (err) {
    console.error('Failed to initialize mock database file:', err);
  }
}

// Seed the realistic class
seedRealisticClass(mockDb);

// Migrate: ensure Grade 6-9 classes exist and distribute seeded students across all classes
const migrateGradeClasses = (db) => {
  const gradesToAdd = [
    { id: 'class-6a', name: 'Grade 6-A', grade_level: 'Grade 6', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'class-7a', name: 'Grade 7-A', grade_level: 'Grade 7', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'class-8a', name: 'Grade 8-A', grade_level: 'Grade 8', teacher_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'class-9a', name: 'Grade 9-A', grade_level: 'Grade 9', teacher_id: 'd1111111-1111-1111-1111-111111111111' }
  ];
  gradesToAdd.forEach(cls => {
    if (!db.classes.some(c => c.id === cls.id)) {
      db.classes.push(cls);
    }
  });
  // Distribute seeded students across classes 6-10 (7 per class)
  const classIds = ['class-6a', 'class-7a', 'class-8a', 'class-9a', 'c1111111-1111-1111-1111-111111111111'];
  db.students.forEach(student => {
    if (student.id.startsWith('std-seed-')) {
      const idx = parseInt(student.id.replace('std-seed-', ''), 10) - 1;
      const classId = classIds[Math.min(Math.floor(idx / 7), 4)];
      student.class_id = classId;
      
      const cls = db.classes.find(c => c.id === classId);
      if (cls) {
        const classNum = cls.name.replace(/[^0-9]/g, '');
        const sectionMatch = cls.name.match(/-([A-Za-z])/);
        const section = sectionMatch ? sectionMatch[1].toUpperCase() : 'A';
        const rollClean = student.roll_number.replace(/[^0-9]/g, '').slice(-3);
        student.student_id = `${classNum}${section}${rollClean}`;
      }
    }
  });

  // Self-heal user password hashes if any are missing
  if (db.users) {
    db.users.forEach(u => {
      if (u.id.startsWith('usr-seed-') && !u.password_hash) {
        u.password_hash = '$2a$10$gbis77QUuhkJ1PEURwn/WOBOQoGuwHHgA62MVoDKnwYCSlH/EiRny'; // password123
      }
    });
  }
};

const seedTimetable = (db) => {
  if (!db.timetable) {
    db.timetable = {
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      periodTimings: [
        { id: "p1", name: "Period 1", startTime: "08:45 AM", endTime: "09:35 AM" },
        { id: "p2", name: "Period 2", startTime: "09:35 AM", endTime: "10:25 AM" },
        { id: "break1", name: "Break", startTime: "10:25 AM", endTime: "10:50 AM", isBreak: true },
        { id: "p3", name: "Period 3", startTime: "10:50 AM", endTime: "11:40 AM" },
        { id: "p4", name: "Period 4", startTime: "11:40 AM", endTime: "12:30 PM" },
        { id: "p5", name: "Period 5", startTime: "12:30 PM", endTime: "01:20 PM" },
        { id: "lunch", name: "Lunch Break", startTime: "01:20 PM", endTime: "02:20 PM", isBreak: true },
        { id: "p6", name: "Period 6", startTime: "02:20 PM", endTime: "03:10 PM" },
        { id: "p7", name: "Period 7", startTime: "03:10 PM", endTime: "04:00 PM" },
        { id: "p8", name: "Period 8", startTime: "04:00 PM", endTime: "04:50 PM" }
      ],
      classTeachers: [
        { classId: "c1111111-1111-1111-1111-111111111111", teacherId: "d1111111-1111-1111-1111-111111111111" },
        { classId: "class-6a", teacherId: "tch-uuidlatha" }
      ],
      attendanceResponsibilityEnabled: true,
      lockedDates: [],
      schedule: [
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p1", subject: "Mathematics", teacherId: "d1111111-1111-1111-1111-111111111111" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p2", subject: "Telugu", teacherId: "tch-uuidlatha" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p3", subject: "English", teacherId: "d1111111-1111-1111-1111-111111111111" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p4", subject: "Science", teacherId: "d1111111-1111-1111-1111-111111111111" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p5", subject: "Social Studies", teacherId: "tch-uuidlatha" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p6", subject: "Hindi", teacherId: "tch-uuidlatha" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Monday", periodId: "p7", subject: "Sports", teacherId: "d1111111-1111-1111-1111-111111111111" },
        
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Tuesday", periodId: "p1", subject: "Mathematics", teacherId: "d1111111-1111-1111-1111-111111111111" },
        { classId: "c1111111-1111-1111-1111-111111111111", day: "Tuesday", periodId: "p2", subject: "Science", teacherId: "d1111111-1111-1111-1111-111111111111" },

        { classId: "class-6a", day: "Monday", periodId: "p1", subject: "Telugu", teacherId: "tch-uuidlatha" },
        { classId: "class-6a", day: "Monday", periodId: "p2", subject: "Mathematics", teacherId: "d1111111-1111-1111-1111-111111111111" },
        { classId: "class-6a", day: "Monday", periodId: "p3", subject: "Science", teacherId: "d1111111-1111-1111-1111-111111111111" }
      ]
    };
  }
};

migrateGradeClasses(mockDb);
seedTimetable(mockDb);

// Self-healing migration for promotions and past performance tables
const migratePromotionTables = (db) => {
  if (!db.promotions) db.promotions = [];
  if (!db.past_performance) db.past_performance = [];
  if (!db.admin_registrations) db.admin_registrations = [];
  if (db.students) {
    db.students.forEach(student => {
      if (!student.status) {
        student.status = 'Enrolled';
      }
    });
  }
};
migratePromotionTables(mockDb);

// Self-healing migration for 8 periods in existing DB
if (mockDb.timetable && mockDb.timetable.periodTimings) {
  const hasP8 = mockDb.timetable.periodTimings.some(pt => pt.id === 'p8');
  if (!hasP8) {
    mockDb.timetable.periodTimings.push({
      id: "p8",
      name: "Period 8",
      startTime: "04:00 PM",
      endTime: "04:50 PM"
    });
  }
}

try {
  fs.writeFileSync(DB_FILE, JSON.stringify(mockDb, null, 2), 'utf8');
  console.log('Successfully completed self-healing realistic database seeding.');
} catch (e) {
  console.error('Failed to save self-healing realistic database seed:', e);
}

// Add a non-enumerable saveToDisk helper function
Object.defineProperty(mockDb, 'saveToDisk', {
  value: function() {
    try {
      if (fs.existsSync(DB_FILE)) {
        try {
          const diskRaw = fs.readFileSync(DB_FILE, 'utf8');
          const diskDb = JSON.parse(diskRaw);
          if (diskDb && Array.isArray(diskDb.users)) {
            // Merge passwords and new users from disk into in-memory mockDb.users
            diskDb.users.forEach(diskUser => {
              const memoryUser = mockDb.users.find(u => u.id === diskUser.id);
              if (memoryUser) {
                if (diskUser.password_hash && !memoryUser.password_hash) {
                  memoryUser.password_hash = diskUser.password_hash;
                } else if (diskUser.password_hash && memoryUser.password_hash && diskUser.password_hash !== memoryUser.password_hash) {
                  // Keep the disk one as it is the most up-to-date registered password
                  memoryUser.password_hash = diskUser.password_hash;
                }
              }
            });
          }
        } catch (e) {
          console.error('Failed to merge disk changes in saveToDisk:', e);
        }
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(mockDb, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write mock database to disk:', err);
    }
  },
  enumerable: false,
  writable: true,
  configurable: true
});

module.exports = mockDb;
