'use client';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface SecureBrowserLockProps {
  examId: string;
  sessionId: string;
  onViolation: (type: string, description: string) => void;
  children: React.ReactNode;
}

export default function SecureBrowserLock({ examId, sessionId, onViolation, children }: SecureBrowserLockProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const isEnabled = useRef(true);

  // Enter Fullscreen
  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      toast.error('Failed to enter fullscreen mode. Please try again.');
    }
  };

  useEffect(() => {
    if (!isEnabled.current) return;

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setWarnings(prev => prev + 1);
        onViolation('FULLSCREEN_EXIT', 'User exited fullscreen mode');
        toast.error('Warning: Exiting fullscreen is a violation!');
      }
    };

    // Visibility (Tab switch) detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => prev + 1);
        onViolation('TAB_SWITCH', 'User switched tabs or minimized browser');
        toast.error('Warning: Tab switching is monitored and recorded!');
      }
    };

    // Copy / Paste restriction
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation('CLIPBOARD_ACCESS', 'User attempted to copy/paste');
      toast.error('Copy/Paste is disabled during the exam.');
    };

    // Right-click restriction
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Keyboard shortcuts restriction (Alt-Tab, Ctrl+C etc)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p' || e.key === 's')) ||
        (e.metaKey && (e.key === 'c' || e.key === 'v' || e.key === 'p' || e.key === 's')) ||
        e.key === 'Alt' ||
        e.key === 'Meta' ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        onViolation('PROHIBITED_KEY_BINDING', `User pressed prohibited key combination: ${e.key}`);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examId, sessionId]);

  if (!isFullscreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Exam Security Lock</h2>
          <p className="text-gray-700 mb-6">
            This exam requires fullscreen mode. Exiting fullscreen, switching tabs, or using prohibited shortcuts will be recorded as cheating violations.
          </p>
          <button 
            onClick={requestFullscreen}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
          >
            Enter Fullscreen to Begin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Warning Indicator */}
      {warnings > 0 && (
        <div className="absolute top-4 left-4 z-50 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold shadow-md">
          Warnings: {warnings}
        </div>
      )}
      
      {/* Protected Content */}
      <div className="w-full h-full pb-20 select-none">
        {children}
      </div>
    </div>
  );
}
