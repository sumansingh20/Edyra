'use client';

import Link from 'next/link';
import { Hammer, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'var(--bg)' 
    }}>
      {/* Header */}
      <header style={{ 
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          height: '64px',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#ffffff' }}>
            <div style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--primary)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              color: '#ffffff',
              lineHeight: 1,
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.4)'
            }}>
              E
            </div>
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.02em' }}>EDYRA</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px 24px',
        background: 'radial-gradient(circle at center, rgba(79,70,229,0.03) 0%, transparent 70%)'
      }}>
        <div style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '48px 40px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeInUp 0.4s ease-out'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)'
          }}>
            <Hammer size={36} strokeWidth={2.5} />
          </div>
          
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 800, 
            color: 'var(--text)', 
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em'
          }}>
            Module Under Construction
          </h1>
          
          <p style={{ 
            fontSize: '15px', 
            color: 'var(--text-muted)', 
            lineHeight: 1.6, 
            margin: '0 0 32px 0' 
          }}>
            This section of the platform is currently being built by our engineering team. 
            It will be available in an upcoming release. Please check back later!
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => window.history.back()}
              className="lms-btn lms-btn-default"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            <Link 
              href="/my" 
              className="lms-btn lms-btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              <Home size={16} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--white)',
        borderTop: '1px solid var(--border)',
        padding: '20px',
        textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', fontWeight: 500 }}>
          &copy; {new Date().getFullYear()} EDYRA Academic OS &middot; All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
