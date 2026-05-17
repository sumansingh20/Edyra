'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface ExamData {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  negativeMarkingEnabled: boolean;
  negativeMarkingValue: number;
  allowReview: boolean;
}

interface Question {
  questionId: string;
  question: { _id: string; questionText: string; questionType: string; options: { id: string; text: string }[]; marks: number; imageUrl?: string };
  markedForReview: boolean;
  selectedOptions: string[];
  numericalAnswer?: number;
  textAnswer?: string;
  isVisited: boolean;
}

interface SessionData {
  _id: string;
  exam: ExamData;
  questions: Question[];
  status: string;
  remainingTime: number;
  currentQuestion: number;
}

type ViolationEvent = 'tab-switch' | 'copy-paste' | 'context-menu' | 'fullscreen-exit' | 'visibility-change';

export default function StudentExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [phase, setPhase] = useState<'loading' | 'briefing' | 'active' | 'submitting' | 'submitted' | 'error'>('loading');
  const [session, setSession] = useState<SessionData | null>(null);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string[]; numerical?: number; text?: string; flagged: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');
  const sessionTokenRef = useRef<string>('');
  const fingerprintRef = useRef<string>('lms-portal');
  const socketRef = useRef<Socket | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const logViolation = useCallback(async (type: ViolationEvent) => {
    if (!sessionIdRef.current) return;
    setViolationCount(v => v + 1);

    if (socketRef.current?.connected) {
      socketRef.current.emit('violation', { type, details: `Violation detected: ${type}` });
    }

    try {
      await api.post(`/student/submissions/${sessionIdRef.current}/violation`, {
        type, severity: type === 'tab-switch' || type === 'fullscreen-exit' ? 'high' : 'medium',
        description: `Violation detected: ${type}`,
        timestamp: new Date().toISOString(),
      });
    } catch { /* silent — still count locally */ }
  }, []);

  // Security: fullscreen, tab-switch, paste detection
  useEffect(() => {
    if (phase !== 'active') return;

    const handleVisibility = () => {
      if (document.hidden) { logViolation('tab-switch'); alert('⚠️ Security Violation: You switched tabs or minimized the browser. Your proctor has been notified.'); }
    };
    const handleFullscreenChange = () => {
      const full = !!document.fullscreenElement;
      setIsFullscreen(full);
      if (!full) logViolation('fullscreen-exit');
    };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); logViolation('context-menu'); };
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy-paste'); };
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy-paste'); };
    const handlePrint = () => { logViolation('copy-paste'); };
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = (e.ctrlKey && ['c', 'v', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase()))
        || (e.metaKey && ['c', 'v', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase()))
        || e.key === 'F12' || e.key === 'PrintScreen' || (e.altKey && e.key === 'Tab');
      if (blocked) { e.preventDefault(); logViolation('copy-paste'); }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handlePrint);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handlePrint);
    };
  }, [phase, logViolation]);

  // Load exam details for briefing
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/student/exams/${examId}`);
        setExamData(res.data.data.exam);
        setPhase('briefing');
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to load exam');
        setPhase('error');
      }
    };
    load();
  }, [examId]);

  // Timer
  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (phase !== 'active') return;
    autoSaveIntervalRef.current = setInterval(() => {
      if (sessionIdRef.current && Object.keys(answers).length > 0) {
        const bulk = Object.entries(answers).map(([qId, a]) => ({
          questionId: qId, selectedOptions: a.selected, numericalAnswer: a.numerical, textAnswer: a.text,
        }));
        api.post(`/student/submissions/${sessionIdRef.current}/answers`, { answers: bulk }).catch(() => {});
      }
    }, 30000);
    return () => { if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current); };
  }, [phase, answers]);

  const startExam = async () => {
    try {
      setPhase('loading');
      await document.documentElement.requestFullscreen?.().catch(() => {});
      const res = await api.post(`/student/exams/${examId}/start`);
      const data = res.data.data;
      setSession(data);
      sessionIdRef.current = data._id;
      sessionTokenRef.current = data.sessionId || data._id;
      const initialAnswers: typeof answers = {};
      (data.questions || []).forEach((q: Question) => {
        initialAnswers[q.questionId] = { selected: q.selectedOptions || [], numerical: q.numericalAnswer, text: q.textAnswer, flagged: q.markedForReview };
      });
      setAnswers(initialAnswers);
      setTimeLeft(data.remainingTime || (data.exam.duration * 60));
      setPhase('active');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start exam');
      setPhase('error');
    }
  };

  // Socket.IO real-time proctoring connection
  useEffect(() => {
    if (phase !== 'active' || !sessionTokenRef.current) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || window.location.origin;
    const socket = io(`${socketUrl}/exam-session`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to /exam-session namespace');
      socket.emit('join-exam', { sessionToken: sessionTokenRef.current, fingerprint: fingerprintRef.current });
    });

    socket.on('violation-recorded', (data: any) => {
      console.log('[Socket] Violation recorded:', data);
      if (data.violationCount !== undefined) {
        setViolationCount(data.violationCount);
      }
      if (data.terminated) {
        toast.error(data.reason || 'Maximum violations exceeded. Exam terminated.');
        handleSubmit(true);
      }
    });

    socket.on('session-terminated', (data: any) => {
      console.warn('[Socket] Session terminated by proctor:', data);
      toast.error(data.reason || 'Session terminated by proctor');
      handleSubmit(true);
    });

    socket.on('force-submit', (data: any) => {
      console.warn('[Socket] Force submit commanded by proctor:', data);
      toast.error(data.reason || 'Exam force submitted by proctor');
      handleSubmit(true);
    });

    socket.on('admin-message', (data: any) => {
      console.log('[Socket] Admin broadcast message:', data);
      setWarningMessage(`📢 Announcement: ${data.message}`);
      setTimeout(() => setWarningMessage(''), 10000);
    });

    return () => {
      socket.disconnect();
    };
  }, [phase]);

  const handleSubmit = async (auto = false) => {
    if (!sessionIdRef.current) return;
    setPhase('submitting');
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    if (socketRef.current?.connected) {
      socketRef.current.emit('submit-exam');
    }
    try {
      await api.post(`/student/submissions/${sessionIdRef.current}/submit`);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      toast.success(auto ? 'Time up! Exam auto-submitted.' : 'Exam submitted successfully!');
      setPhase('submitted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
      setPhase('active');
    }
  };

  const selectOption = (questionId: string, optionId: string, type: string) => {
    setAnswers(prev => {
      const cur = prev[questionId] || { selected: [], flagged: false };
      let selected: string[];
      if (type === 'mcq') {
        selected = cur.selected.includes(optionId) ? [] : [optionId];
      } else {
        selected = cur.selected.includes(optionId) ? cur.selected.filter(o => o !== optionId) : [...cur.selected, optionId];
      }
      return { ...prev, [questionId]: { ...cur, selected } };
    });
    if (socketRef.current?.connected) {
      socketRef.current.emit('save-answer', { questionId, answer: { selectedOption: optionId } });
    }
    // Fire-and-forget save
    if (sessionIdRef.current) {
      api.post(`/student/submissions/${sessionIdRef.current}/answer`, {
        questionId, selectedOptions: answers[questionId]?.selected || [],
      }).catch(() => {});
    }
  };

  const flagQuestion = (questionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], flagged: !prev[questionId]?.flagged } }));
    if (sessionIdRef.current) {
      api.post(`/student/submissions/${sessionIdRef.current}/visit`, { questionId, markedForReview: !answers[questionId]?.flagged }).catch(() => {});
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const questions = session?.questions || [];
  const currentQ = questions[current];
  const currentAns = currentQ ? (answers[currentQ.questionId] || { selected: [], flagged: false }) : null;
  const answered = questions.filter(q => (answers[q.questionId]?.selected?.length || 0) > 0 || answers[q.questionId]?.text || answers[q.questionId]?.numerical !== undefined).length;
  const flagged = questions.filter(q => answers[q.questionId]?.flagged).length;
  const timerDanger = timeLeft < 300;

  // ── BRIEFING SCREEN ──
  if (phase === 'briefing' && examData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', fontFamily: 'var(--font-inter, sans-serif)' }}>
      <div style={{ maxWidth: 640, width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--nav-bg, #1a2340)', color: '#fff', padding: '32px 40px' }}>
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>EDYRA SECURE EXAM</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{examData.title}</h1>
          <div style={{ marginTop: 8, opacity: 0.8 }}>{examData.subject}</div>
        </div>
        <div style={{ padding: '28px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Duration', val: `${examData.duration} minutes` },
              { label: 'Total Marks', val: examData.totalMarks },
              { label: 'Passing Marks', val: examData.passingMarks },
              { label: 'Negative Marking', val: examData.negativeMarkingEnabled ? `Yes (${examData.negativeMarkingValue} per wrong)` : 'No' },
            ].map(i => (
              <div key={i.label} style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{i.label}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{i.val}</div>
              </div>
            ))}
          </div>

          {examData.instructions && (
            <div style={{ marginBottom: 24, padding: 16, borderLeft: '4px solid var(--primary, #f98012)', background: '#fff8f0', borderRadius: 4 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Instructions:</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{examData.instructions}</div>
            </div>
          )}

          <div style={{ padding: 16, background: '#fff3cd', borderRadius: 8, marginBottom: 24, fontSize: 13 }}>
            <strong>⚠️ Secure Exam Rules:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>This exam will enter full-screen mode. Exiting full-screen logs a violation.</li>
              <li>Tab switching, copy-paste, and print are monitored and logged.</li>
              <li>Answers are auto-saved every 30 seconds.</li>
              <li>The exam auto-submits when time expires.</li>
            </ul>
          </div>

          <button
            onClick={startExam}
            style={{ width: '100%', padding: '16px', background: 'var(--nav-bg, #1a2340)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            🔒 Start Secure Exam
          </button>
        </div>
      </div>
    </div>
  );

  // ── ACTIVE EXAM ──
  if (phase === 'active' && session) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f4f8', userSelect: 'none', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'var(--nav-bg, #1a2340)', color: '#fff', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{session.exam.title}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>EDYRA Secure Exam — {violationCount > 0 && <span style={{ color: '#ff6b6b' }}>{violationCount} violation(s) logged</span>}{violationCount === 0 && 'No violations'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Answered</div>
            <div style={{ fontWeight: 700 }}>{answered} / {questions.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Flagged</div>
            <div style={{ fontWeight: 700 }}>{flagged}</div>
          </div>
          <div style={{ background: timerDanger ? '#dc3545' : '#28a745', padding: '8px 16px', borderRadius: 6 }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Time Left</div>
            <div style={{ fontWeight: 800, fontSize: 20, fontFamily: 'monospace' }}>{fmt(timeLeft)}</div>
          </div>
          <button
            onClick={() => { if (window.confirm('Submit exam now? This cannot be undone.')) handleSubmit(false); }}
            style={{ padding: '8px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
          >
            Submit
          </button>
        </div>
      </div>

      {warningMessage && (
        <div style={{ background: '#ffc107', color: '#000', padding: '8px 24px', fontWeight: 600, textAlign: 'center', fontSize: 14 }}>
          {warningMessage}
        </div>
      )}

      {/* SEB Fullscreen Lock Overlay */}
      {!isFullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#ff6b6b' }}>SEB Fullscreen Lock Exited</h2>
          <p style={{ fontSize: 16, maxWidth: 500, marginBottom: 24, lineHeight: 1.6, opacity: 0.9 }}>
            You have exited full-screen mode, which is a strict security violation. Your exam is temporarily paused and your proctor has been alerted.
          </p>
          <button
            onClick={async () => { await document.documentElement.requestFullscreen?.().catch(() => {}); setIsFullscreen(true); }}
            style={{ padding: '14px 32px', background: 'var(--primary, #f98012)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,128,18,0.3)' }}
          >
            🔒 Click Here to Return to Fullscreen
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 0, overflow: 'hidden' }}>
        {/* Question area */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          {currentQ && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#666' }}>Question {current + 1} of {questions.length} • {currentQ.question?.marks} mark{currentQ.question?.marks !== 1 ? 's' : ''}</div>
                <button
                  onClick={() => flagQuestion(currentQ.questionId)}
                  style={{ padding: '6px 14px', background: currentAns?.flagged ? '#ffc107' : '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  {currentAns?.flagged ? '🚩 Flagged' : '🏳️ Flag'}
                </button>
              </div>

              <div style={{ background: '#fff', borderRadius: 10, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {currentQ.question?.imageUrl && (
                  <img src={currentQ.question.imageUrl} alt="Question" style={{ maxWidth: '100%', marginBottom: 16, borderRadius: 8 }} />
                )}
                <div style={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500 }}>{currentQ.question?.questionText}</div>
              </div>

              {(currentQ.question?.questionType === 'mcq' || currentQ.question?.questionType === 'msq') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {currentQ.question.options.map(opt => {
                    const sel = currentAns?.selected.includes(opt.id);
                    return (
                      <button key={opt.id} onClick={() => selectOption(currentQ.questionId, opt.id, currentQ.question.questionType)}
                        style={{ padding: '14px 20px', background: sel ? 'var(--primary, #f98012)' : '#fff', color: sel ? '#fff' : 'inherit', border: sel ? '2px solid var(--primary)' : '2px solid #dee2e6', borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontSize: 15, fontWeight: sel ? 600 : 400, transition: 'all 0.15s' }}>
                        <strong style={{ marginRight: 10 }}>{String.fromCharCode(65 + currentQ.question.options.indexOf(opt))}.</strong> {opt.text}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.question?.questionType === 'numerical' && (
                <input type="number" style={{ width: '100%', padding: 14, fontSize: 18, borderRadius: 8, border: '2px solid #dee2e6', fontFamily: 'monospace' }}
                  value={currentAns?.numerical ?? ''} placeholder="Enter numerical answer"
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQ.questionId]: { ...prev[currentQ.questionId], numerical: parseFloat(e.target.value) } }))} />
              )}

              {currentQ.question?.questionType === 'descriptive' && (
                <textarea style={{ width: '100%', padding: 14, fontSize: 14, borderRadius: 8, border: '2px solid #dee2e6', minHeight: 160, resize: 'vertical' }}
                  value={currentAns?.text ?? ''} placeholder="Write your answer here..."
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQ.questionId]: { ...prev[currentQ.questionId], text: e.target.value } }))} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                  style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #dee2e6', background: '#fff', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1 }}>
                  ← Previous
                </button>
                <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--nav-bg, #1a2340)', color: '#fff', cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: current === questions.length - 1 ? 0.5 : 1 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question palette */}
        <div style={{ background: '#fff', borderLeft: '1px solid #dee2e6', padding: 20, overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: '#444' }}>Question Navigator</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {questions.map((q, i) => {
              const a = answers[q.questionId];
              const isAnswered = (a?.selected?.length || 0) > 0 || !!a?.text || a?.numerical !== undefined;
              const isFlagged = a?.flagged;
              const isCurrent = i === current;
              return (
                <button key={i} onClick={() => setCurrent(i)}
                  style={{ aspectRatio: '1', borderRadius: 6, border: isCurrent ? '2px solid var(--primary, #f98012)' : '1px solid #dee2e6', background: isFlagged ? '#ffc107' : isAnswered ? '#28a745' : '#f8f9fa', color: isFlagged || isAnswered ? '#fff' : '#333', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: isCurrent ? '0 0 0 2px rgba(249,128,18,0.3)' : 'none' }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: '#666' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><div style={{ width: 12, height: 12, background: '#28a745', borderRadius: 2 }} /> Answered</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><div style={{ width: 12, height: 12, background: '#ffc107', borderRadius: 2 }} /> Flagged</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 12, height: 12, background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 2 }} /> Not answered</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── SUBMITTED ──
  if (phase === 'submitted') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ maxWidth: 500, width: '100%', background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Exam Submitted</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>Your answers have been recorded. Results will be published by your faculty.</p>
        {violationCount > 0 && (
          <div style={{ padding: 12, background: '#fff3cd', borderRadius: 8, marginBottom: 24, fontSize: 13 }}>
            ⚠️ {violationCount} violation(s) were recorded during this exam.
          </div>
        )}
        <button onClick={() => router.push('/student/grades')}
          style={{ padding: '12px 32px', background: 'var(--nav-bg, #1a2340)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
          View My Grades
        </button>
      </div>
    </div>
  );

  // ── LOADING / ERROR ──
  if (phase === 'error') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2>Failed to Load Exam</h2>
        <p style={{ color: '#666' }}>This exam may not be available or has already been completed.</p>
        <button onClick={() => router.push('/student/dashboard')}
          style={{ marginTop: 16, padding: '10px 24px', background: 'var(--nav-bg, #1a2340)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 16, color: '#666' }}>Preparing secure exam environment...</div>
      </div>
    </div>
  );
}
