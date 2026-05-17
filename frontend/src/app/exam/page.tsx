'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Lock, Wifi, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  type: 'mcq' | 'short' | 'essay';
  options?: string[];
  answer?: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'What is the capital of France?',
    type: 'mcq',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    answer: 'Paris',
  },
  {
    id: 2,
    text: 'What is 15 + 27?',
    type: 'mcq',
    options: ['42', '41', '40', '39'],
    answer: '42',
  },
  {
    id: 3,
    text: 'Explain photosynthesis in 50 words',
    type: 'essay',
    answer: '',
  },
];

export default function ExamPage() {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [violations, setViolations] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen enforcement
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        addViolation('Fullscreen required');
      }
    };
    enterFullscreen();
  }, []);

  // Detect tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('⚠️ Suspicious Activity: Tab switch detected');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Tab' || e.key === 't')) {
        addViolation('⚠️ Tab opening blocked');
        e.preventDefault();
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        addViolation('⚠️ Developer tools detected');
        e.preventDefault();
      }
      if (e.ctrlKey && e.key === 'c') {
        addViolation('⚠️ Copy-paste disabled');
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Webcam access
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch {
        addViolation('📷 Camera access denied');
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const addViolation = (msg: string) => {
    setViolations((v) => [...v, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleAnswerChange = (answer: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (q.type === 'mcq' && answers[q.id] === q.answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setSubmitted(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const question = questions[currentQuestion];

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '40px 20px' }}>
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            background: '#fff',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <CheckCircle style={{ width: 80, height: 80, color: '#10b981', margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Exam Submitted!</h1>
          <div
            style={{
              background: '#f0f9ff',
              border: '2px solid #0284c7',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#0284c7' }}>
              Score: {score} / {questions.length}
            </p>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Violations Recorded:</h3>
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {violations.length === 0 ? (
                <p style={{ color: '#10b981', margin: 0, fontSize: '14px' }}>✅ No violations</p>
              ) : (
                violations.map((v, i) => (
                  <p key={i} style={{ color: '#dc2626', margin: '6px 0', fontSize: '13px' }}>
                    {v}
                  </p>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 32px',
              background: '#1d4f91',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div
        style={{
          background: '#1d4f91',
          color: '#fff',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>🔒 Secure Exam Mode</span>
          <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Wifi style={{ width: 16, height: 16 }} /> Connected
          </span>
        </div>
        <div style={{ fontWeight: 600, fontSize: '16px' }}>
          Time: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Webcam Panel */}
        <div
          style={{
            width: '320px',
            background: '#1a1a1a',
            padding: '16px',
            borderRight: '2px solid #333',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>📷 PROCTORING</div>
          <div
            style={{
              background: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              border: cameraActive ? '2px solid #10b981' : '2px solid #ef4444',
              aspectRatio: '4/3',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div
            style={{
              background: cameraActive ? '#dbeafe' : '#fee2e2',
              border: `1px solid ${cameraActive ? '#0284c7' : '#fca5a5'}`,
              borderRadius: '6px',
              padding: '8px',
              fontSize: '12px',
              color: cameraActive ? '#0284c7' : '#dc2626',
            }}
          >
            {cameraActive ? '✅ Camera Active' : '❌ Camera Inactive'}
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '16px' }}>
            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              ⚠️ VIOLATIONS ({violations.length})
            </div>
            <div
              style={{
                background: '#2a1a1a',
                borderRadius: '6px',
                padding: '8px',
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '11px',
                color: '#fca5a5',
              }}
            >
              {violations.length === 0 ? (
                <div style={{ color: '#86efac' }}>✅ No violations</div>
              ) : (
                violations.map((v, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>
                    • {v}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Exam Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Question Navigation */}
          <div
            style={{
              background: '#f8f9fa',
              padding: '16px 20px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              borderBottom: '1px solid #dee2e6',
            }}
          >
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                style={{
                  padding: '8px 16px',
                  background: i === currentQuestion ? '#1d4f91' : answers[q.id] ? '#10b981' : '#e5e7eb',
                  color: i === currentQuestion || answers[q.id] ? '#fff' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                Q{i + 1} {answers[q.id] && '✓'}
              </button>
            ))}
          </div>

          {/* Question Content */}
          <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#fff' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '24px',
                  color: '#1a1a1a',
                }}
              >
                Question {currentQuestion + 1} of {questions.length}
              </div>

              <div
                style={{
                  background: '#f0f9ff',
                  border: '2px solid #0284c7',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px',
                  fontSize: '16px',
                  color: '#1a1a1a',
                  lineHeight: 1.6,
                }}
              >
                {question.text}
              </div>

              {question.type === 'mcq' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {question.options?.map((option, i) => (
                    <label
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: answers[question.id] === option ? '#dbeafe' : '#f8f9fa',
                        border: answers[question.id] === option ? '2px solid #0284c7' : '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        style={{ marginRight: '12px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '15px', color: '#1a1a1a' }}>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'essay' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    height: '240px',
                    padding: '16px',
                    border: '2px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div
            style={{
              background: '#f8f9fa',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #dee2e6',
            }}
          >
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              style={{
                padding: '10px 24px',
                background: currentQuestion === 0 ? '#e5e7eb' : '#1d4f91',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              ← Previous
            </button>

            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
              style={{
                padding: '10px 24px',
                background: currentQuestion === questions.length - 1 ? '#e5e7eb' : '#1d4f91',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentQuestion === questions.length - 1 ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              Next →
            </button>

            {currentQuestion === questions.length - 1 && (
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 32px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                ✓ Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
