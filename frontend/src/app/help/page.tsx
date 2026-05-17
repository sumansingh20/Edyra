import Link from 'next/link';

const FAQ = [
  { q: 'What format should I enter my Date of Birth?', a: 'Enter your DOB in DDMMYYYY format. For example, if you were born on 1st January 2000, enter 01012000.' },
  { q: 'I forgot my Student ID. What do I do?', a: 'Contact your institution\'s examination controller or admin office. Your Student ID is printed on your ID card and admission letter.' },
  { q: 'My exam session was interrupted. Can I resume?', a: 'Yes. If your session is interrupted, you can log back in and resume from where you left off, as long as the exam window is still open. All your previous answers are auto-saved.' },
  { q: 'What happens if I switch tabs during an exam?', a: 'Tab switching is monitored and logged. Multiple violations may result in automatic termination of your exam session. Always stay on the exam tab.' },
  { q: 'How do I view my results?', a: 'After your exam is graded, you can view results in My Dashboard → Results. Result visibility depends on your institution\'s release schedule.' },
  { q: 'Is there a calculator available?', a: 'If your teacher has enabled calculator access for a specific exam, an on-screen calculator will appear. External calculators are not permitted.' },
  { q: 'How do I reset my password?', a: 'Click "Forgot Password?" on the login page and enter your registered email. A reset link will be sent to you.' },
  { q: 'Who do I contact for technical support?', a: 'Contact your institution\'s IT helpdesk or email the system administrator. Include your Student ID, the exam name, and a description of the issue.' },
];

const EXAM_RULES = [
  { title: 'Secure Browser', desc: 'Do not switch tabs, open new windows, or use keyboard shortcuts during the exam. All actions are monitored.' },
  { title: 'Time Limit', desc: 'Each exam has a strict time limit. Your exam will be auto-submitted when the timer expires.' },
  { title: 'Violations', desc: 'Tab switching, copy-paste, right-click, and other suspicious activities are flagged. Too many violations may lead to auto-termination.' },
  { title: 'Question Navigation', desc: 'Use the question palette to navigate between questions. You can mark questions for review and return to them later.' },
  { title: 'Auto-Save', desc: 'Your answers are saved automatically every time you select or change an answer. If you lose connection, you can resume from where you left off.' },
  { title: 'Calculator', desc: 'If enabled by the teacher, an on-screen calculator is available during the exam. No physical calculators are allowed.' },
];

export default function HelpPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="pub-header">
        <Link href="/" className="lms-logo">
          <div className="lms-logo-icon">E</div>
          <div>
            <div className="lms-logo-text">EDYRA</div>
            <div className="lms-logo-subtitle">Learning Management System</div>
          </div>
        </Link>
        <nav className="pub-nav">
          <Link href="/">Home</Link>
          <Link href="/login">Sign In</Link>
        </nav>
      </header>

      {/* Page header */}
      <div style={{ background: 'var(--nav-bg)', color: '#fff', padding: '24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Help & Documentation</h1>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)' }}>Home</Link>
            {' / '}
            <span>Help & Documentation</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', width: '100%', flex: 1 }}>
        
        {/* Quick Start Guide */}
        <div className="lms-section" style={{ marginBottom: 20 }}>
          <div className="lms-section-title">🚀 Quick Start Guide</div>
          <div className="help-grid" style={{ padding: 16 }}>
            <div className="lms-info-box" style={{ marginBottom: 0 }}>
              <div className="lms-info-box-header">🎓 For Students</div>
              <div className="lms-info-box-body">
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, lineHeight: 2, color: 'var(--text)' }}>
                  <li>Login with your <strong>Student ID</strong> and <strong>Date of Birth</strong></li>
                  <li>Go to <strong>My Exams</strong> to see available examinations</li>
                  <li>Click on an exam to view instructions and rules</li>
                  <li>Start the exam when the examination window opens</li>
                  <li>Submit before the timer runs out — auto-submit is enabled</li>
                </ul>
              </div>
            </div>
            <div className="lms-info-box" style={{ marginBottom: 0 }}>
              <div className="lms-info-box-header">👨‍🏫 For Teachers</div>
              <div className="lms-info-box-body">
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, lineHeight: 2, color: 'var(--text)' }}>
                  <li>Login with your <strong>institutional email</strong> and <strong>password</strong></li>
                  <li>Create exams from the <strong>Exams</strong> section</li>
                  <li>Add questions to your <strong>Question Bank</strong></li>
                  <li>Monitor live exams in real-time from <strong>Live Monitor</strong></li>
                  <li>View and grade student results and violation reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Rules */}
        <div className="lms-section" style={{ marginBottom: 20 }}>
          <div className="lms-section-title">📋 Examination Rules & Policies</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 12, padding: 16 }}>
            {EXAM_RULES.map(rule => (
              <div key={rule.title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--nav-bg)', marginBottom: 6 }}>{rule.title}</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="lms-section" style={{ marginBottom: 20 }}>
          <div className="lms-section-title">❓ Frequently Asked Questions</div>
          <div style={{ padding: 16 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '14px 0' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--nav-bg)', marginBottom: 6 }}>
                  Q{i + 1}. {item.q}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, paddingLeft: 20 }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="lms-section">
          <div className="lms-section-title">📞 Contact & Support</div>
          <div style={{ padding: 16 }}>
            <div className="help-grid">
              <div>
                <div className="lms-info-row">
                  <div className="lms-info-label">📧 Email</div>
                  <div className="lms-info-value"><a href="mailto:support@edyra.edu">support@edyra.edu</a></div>
                </div>
                <div className="lms-info-row">
                  <div className="lms-info-label">🕐 Hours</div>
                  <div className="lms-info-value">Mon–Fri: 8:00 AM – 6:00 PM</div>
                </div>
                <div className="lms-info-row">
                  <div className="lms-info-label">📱 Hotline</div>
                  <div className="lms-info-value" style={{ fontFamily: 'monospace' }}>+91-XXXX-XXXXXX</div>
                </div>
              </div>
              <div className="lms-alert lms-alert-info">
                <div>
                  <div className="lms-alert-title">Technical Issues During Exam</div>
                  <div style={{ fontSize: 12 }}>If you experience a technical issue during an active examination, stay on the page and immediately call the examination invigilator or the IT helpdesk. Do not close the browser.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link href="/login" className="lms-btn lms-btn-primary" style={{ marginRight: 10 }}>Sign In to Portal</Link>
          <Link href="/" className="lms-btn lms-btn-default">Back to Home</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="pub-footer">
        <div>© {new Date().getFullYear()} EDYRA — Learning Management System</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}
