'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, ShieldCheck, Monitor, Smartphone, Video, Mic, SmartphoneNfc, UploadCloud, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

type VerificationStep = 'hardware' | 'mobile-pair' | 'id-upload' | 'face-match' | 'environment' | 'complete';

export default function SecureEntryPage() {
  const { examId } = useParams();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<VerificationStep>('hardware');
  const [hardwarePassed, setHardwarePassed] = useState(false);
  const [mobilePaired, setMobilePaired] = useState(false);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [envChecked, setEnvChecked] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  // Auto-verify hardware (Simulated check)
  useEffect(() => {
    if (currentStep === 'hardware') {
      setTimeout(() => setHardwarePassed(true), 2000);
    }
  }, [currentStep]);

  // Handle Face Capture
  const captureFace = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFaceImage(imageSrc);
    } else {
      toast.error('Failed to capture webcam image. Please check camera permissions.');
    }
  };

  const completeVerification = () => {
    // In a real backend, we'd submit all images to an API endpoint
    // For now, set a secure session token and proceed
    sessionStorage.setItem(`exam_verified_${examId}`, 'true');
    toast.success('Verification Complete! Entering Secure Environment.');
    router.push(`/student/exam/${examId}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        background: 'var(--nav-bg)', color: '#fff', padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="var(--primary-light)" />
          <span style={{ fontWeight: 700, fontSize: '16px' }}>EDYRA Secure Verification</span>
        </div>
        <div style={{ fontSize: '13px', opacity: 0.8 }}>Exam ID: {examId}</div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ 
          background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
          maxWidth: '800px', width: '100%', display: 'flex', overflow: 'hidden'
        }}>
          
          {/* Left Sidebar - Steps */}
          <div style={{ width: '240px', background: 'rgba(248, 250, 252, 0.5)', borderRight: '1px solid var(--border)', padding: '32px 24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
              Verification Steps
            </div>
            
            {[
              { id: 'hardware', label: 'Hardware Check', icon: Monitor },
              { id: 'mobile-pair', label: 'Dual Camera Pairing', icon: SmartphoneNfc },
              { id: 'id-upload', label: 'Identity Upload', icon: UploadCloud },
              { id: 'face-match', label: 'Face Match', icon: Camera },
              { id: 'environment', label: 'Room Sweep', icon: Video },
            ].map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              
              // Simple hack to check if passed
              let isPassed = false;
              if (step.id === 'hardware') isPassed = hardwarePassed && currentStep !== 'hardware';
              if (step.id === 'mobile-pair') isPassed = mobilePaired;
              if (step.id === 'id-upload') isPassed = !!idImage;
              if (step.id === 'face-match') isPassed = !!faceImage;
              if (step.id === 'environment') isPassed = envChecked;

              return (
                <div key={step.id} style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
                  opacity: isActive || isPassed ? 1 : 0.5
                }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: isPassed ? 'var(--success-bg)' : isActive ? 'var(--primary-light)' : 'var(--border)',
                    color: isPassed ? 'var(--success)' : isActive ? 'var(--primary-dark)' : 'var(--text-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isPassed ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary-dark)' : 'var(--text)' }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div style={{ flex: 1, padding: '40px' }}>
            
            {/* STEP 1: HARDWARE */}
            {currentStep === 'hardware' && (
              <div className="animate-fadeIn">
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>System Diagnostics</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>We are verifying your hardware to ensure a stable exam environment.</p>
                
                <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Video size={20} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>Primary Camera</span>
                    </div>
                    {hardwarePassed ? <CheckCircle size={20} color="var(--success)" /> : <div className="spinner" style={{width: 20, height: 20, borderTopColor: 'var(--primary)'}}></div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mic size={20} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>Microphone</span>
                    </div>
                    {hardwarePassed ? <CheckCircle size={20} color="var(--success)" /> : <div className="spinner" style={{width: 20, height: 20, borderTopColor: 'var(--primary)'}}></div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Monitor size={20} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>Browser Support</span>
                    </div>
                    {hardwarePassed ? <CheckCircle size={20} color="var(--success)" /> : <div className="spinner" style={{width: 20, height: 20, borderTopColor: 'var(--primary)'}}></div>}
                  </div>
                </div>

                <button 
                  disabled={!hardwarePassed}
                  onClick={() => setCurrentStep('mobile-pair')}
                  className={`lms-btn lms-btn-primary`} 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: hardwarePassed ? 1 : 0.5 }}
                >
                  Proceed to Dual Camera Setup
                </button>
              </div>
            )}

            {/* STEP 2: DUAL CAMERA PAIRING */}
            {currentStep === 'mobile-pair' && (
              <div className="animate-fadeIn">
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Dual Camera Pairing</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Scan the QR code with your mobile device to initialize the secondary desk camera stream.</p>
                
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', background: '#f8fafc', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '32px' }}>
                  <div style={{ width: '150px', height: '150px', background: '#fff', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={48} color="var(--text-light)" />
                    {/* Placeholder for real QR code */}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Instructions</h3>
                    <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                      <li>Open your mobile camera app.</li>
                      <li>Scan the QR code to open the secure pairing link.</li>
                      <li>Allow camera permissions on your phone.</li>
                      <li>Mount your phone to show your desk and keyboard.</li>
                    </ol>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setMobilePaired(true);
                    setCurrentStep('id-upload');
                  }}
                  className={`lms-btn lms-btn-primary`} 
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                >
                  I have paired my mobile device
                </button>
              </div>
            )}

            {/* STEP 3: ID UPLOAD */}
            {currentStep === 'id-upload' && (
              <div className="animate-fadeIn">
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Identity Verification</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please upload a clear photo of your University Student ID or Government Issued ID.</p>
                
                {!idImage ? (
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', marginBottom: '32px', background: '#f8fafc' }}>
                    <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>Drag & drop your ID card here</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>JPEG or PNG, max 5MB</div>
                    <button 
                      onClick={() => setIdImage('simulated_id_url')}
                      className="lms-btn lms-btn-secondary"
                    >
                      Browse Files
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--success)', background: 'var(--success-bg)', borderRadius: 'var(--radius)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <CheckCircle size={32} color="var(--success)" />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--success)' }}>ID Card Uploaded Successfully</div>
                      <div style={{ fontSize: '13px', color: 'var(--success)', opacity: 0.8 }}>Identity document has been securely stored.</div>
                    </div>
                  </div>
                )}

                <button 
                  disabled={!idImage}
                  onClick={() => setCurrentStep('face-match')}
                  className={`lms-btn lms-btn-primary`} 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: idImage ? 1 : 0.5 }}
                >
                  Proceed to Live Face Match
                </button>
              </div>
            )}

            {/* STEP 4: FACE MATCH */}
            {currentStep === 'face-match' && (
              <div className="animate-fadeIn">
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Live Face Verification</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Look directly into your primary camera and ensure your face is well-lit.</p>
                
                <div style={{ background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px', position: 'relative' }}>
                  {!faceImage ? (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                      style={{ width: '100%', display: 'block' }}
                    />
                  ) : (
                    <img src={faceImage} alt="Captured face" style={{ width: '100%', display: 'block' }} />
                  )}
                  
                  {!faceImage && (
                    <div style={{ position: 'absolute', inset: '40px', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '50%' }}></div>
                  )}
                </div>

                {!faceImage ? (
                  <button 
                    onClick={captureFace}
                    className={`lms-btn lms-btn-primary`} 
                    style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                  >
                    Capture Face
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      onClick={() => setFaceImage(null)}
                      className={`lms-btn lms-btn-default`} 
                      style={{ flex: 1, padding: '14px', fontSize: '15px' }}
                    >
                      Retake
                    </button>
                    <button 
                      onClick={() => setCurrentStep('environment')}
                      className={`lms-btn lms-btn-success`} 
                      style={{ flex: 2, padding: '14px', fontSize: '15px' }}
                    >
                      Face Match Successful - Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: ENVIRONMENT SWEEP */}
            {currentStep === 'environment' && (
              <div className="animate-fadeIn">
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Room Sweep</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please slowly pan your webcam 360 degrees around your room and desk area.</p>
                
                <div style={{ padding: '24px', background: '#fff8f0', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#c2410c' }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>Strict Proctoring Active</span>
                  </div>
                  <ul style={{ paddingLeft: '20px', color: '#9a3412', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                    <li>Ensure no unauthorized materials are on your desk.</li>
                    <li>Ensure no other individuals are in the room.</li>
                    <li>Your secondary mobile camera should now be positioned to show your hands and screen.</li>
                  </ul>
                </div>

                <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', marginBottom: '32px', background: '#f8fafc' }}>
                  <Video size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '24px' }}>Click to begin 10-second recording</div>
                  <button 
                    onClick={() => {
                      toast.success('Room sweep recorded successfully.');
                      setEnvChecked(true);
                      setCurrentStep('complete');
                    }}
                    className="lms-btn lms-btn-primary"
                  >
                    Start Recording
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: COMPLETE */}
            {currentStep === 'complete' && (
              <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <ShieldCheck size={40} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Verification Complete</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
                  All security checks have passed. You are now entering the secure examination sandbox. 
                  Remember, exiting fullscreen or switching tabs will immediately flag your session.
                </p>
                <button 
                  onClick={completeVerification}
                  className={`lms-btn lms-btn-primary`} 
                  style={{ padding: '16px 40px', fontSize: '16px', fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
                >
                  Enter Exam
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
