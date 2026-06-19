import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ role, activeUser, teacherSubject, isOpen, onClose, childLinked, studentVerified }) => {
  // Define navigation items dynamically per role
  const getNavLinks = () => {
    const commonLinks = [
      { path: '/announcements', label: '📢 Notices & Events' },
      { path: '/profile', label: '👤 Personal Profile' },
      { path: '/settings', label: '⚙️ Settings' }
    ];

    switch (role) {
      case 'admin':
        return [
          { path: '/dashboard', label: '📊 Admin Console' },
          { path: '/attendance', label: '📅 Pupil Attendance' },
          { path: '/marks', label: '🏆 Class Marks & GPA' },
          { path: '/behaviour', label: '⭐ Conduct Records' },
          { path: '/complaints', label: '⚠️ Complaints Board' },
          { path: '/timetable', label: '📅 Timetable Management' },
          { path: '/promotion', label: '🎓 Student Promotion' },
          { path: '/teacher-login', label: '🔑 Teacher Login Management' },
          ...commonLinks
        ];
      case 'teacher': {
        const teacherLinks = [
          { path: '/dashboard', label: '👨‍🏫 Teacher Console' },
          { path: '/attendance', label: '📅 Daily Attendance' },
          { path: '/marks', label: '🏆 Student Marks' },
          { path: '/behaviour', label: '⭐ Behaviour Tracker' },
          { path: '/timetable', label: '📅 Timetable' },
          { path: '/student-login', label: '🔑 Student Login Management' },
          ...commonLinks
        ];
        // Sports teachers don't have a marks section
        if (teacherSubject === 'Sports') {
          return teacherLinks.filter(link => link.path !== '/marks');
        }
        return teacherLinks;
      }
      case 'parent':
        return childLinked ? [
          { path: '/dashboard', label: '🏡 Parent Console' },
          { path: '/attendance', label: '📅 Attendance Record' },
          { path: '/marks', label: '🏆 Child Grades' },
          { path: '/behaviour', label: '⭐ Observation Log' },
          { path: '/complaints', label: '⚠️ Complaint Box' },
          { path: '/timetable', label: '📅 Timetable' },
          ...commonLinks
        ] : [
          { path: '/dashboard', label: '🏡 Parent Console' },
          { path: '/timetable', label: '📅 Timetable' },
          ...commonLinks
        ];
      case 'student':
        return [
          { path: '/dashboard', label: '🎓 Student Console' },
          { path: '/chatbot', label: '🤖 AI Study Companion' },
          { path: '/attendance', label: '📅 Attendance Management' },
          { path: '/marks', label: '🏆 Academic Analytics' },
          { path: '/behaviour', label: '⭐ Student Discipline & Feedback' },
          { path: '/timetable', label: '📅 Timetable' },
          { path: '/announcements', label: '📢 Notices & Events' },
          { path: '/profile', label: '👤 Student Profile' },
          { path: '/settings', label: '⚙️ Settings' }
        ];
      default:
        return commonLinks;
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      {/* Sidebar container */}
      <aside
        className={`sidebar ${isOpen ? 'active' : ''}`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          color: 'var(--sidebar-text)'
        }}
      >
        {/* Sidebar Header: School Logo/Branding */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          height: '70px'
        }}>
          <span style={{ fontSize: '1.75rem' }}>⚡</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
              color: 'white',
              lineHeight: 1
            }}>
              EduBridge
            </span>
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--sidebar-text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px'
            }}>
              ERP Ecosystem
            </span>
          </div>
        </div>

        {/* User Role Card inside Sidebar */}
        {activeUser && (
          <div style={{
            padding: '1.25rem 2rem',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <img
              src={activeUser.avatar}
              alt={activeUser.name}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.15)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'white',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>
                {activeUser.name}
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--primary)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginTop: '2px'
              }}>
                {role} account
              </span>
            </div>
          </div>
        )}

        {/* Sidebar Nav Links list */}
        <nav style={{
          padding: '1.5rem 1rem',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          {navLinks.map((link) => {
            const targetPath = link.path.startsWith(`/${role}`) ? link.path : `/${role}${link.path}`;
            return (
              <NavLink
                key={link.path}
                to={targetPath}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'white' : 'var(--sidebar-text-muted)',
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                  transition: 'all var(--transition-fast)'
                })}
                onMouseOver={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.color = 'var(--sidebar-text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer branding */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.75rem',
          color: 'var(--sidebar-text-muted)',
          fontWeight: 500
        }}>
          Version 1.2.0 (v2026)
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
