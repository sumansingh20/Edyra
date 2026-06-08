'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import toast from 'react-hot-toast';
import { 
  Settings, Clock, Users, Award, FileCheck, Shield,
  AlertCircle, Info, ArrowRight, Save
} from 'lucide-react';

interface ExamSettings {
  title: string;
  courseCode: string;
  subject: string;
  description: string;
  instructions: string;
  duration: number;
  startTime: string;
  endTime: string;
  batchSize: number;
  batchNumber: number;
  totalBatches: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showQuestionNumbers: boolean;
  maxAttempts: number;
  allowReview: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  calculatorType: 'none' | 'basic' | 'scientific';
  requireFullscreen: boolean;
  detectTabSwitch: boolean;
  detectCopyPaste: boolean;
  maxViolations: number;
  blockRightClick: boolean;
}

const defaultSettings: ExamSettings = {
  title: '',
  courseCode: '',
  subject: '',
  description: '',
  instructions: '1. Read all instructions carefully before starting.\n2. All questions are compulsory.\n3. Do not navigate away from the exam window.\n4. Auto-submit will occur when time expires.',
  duration: 60,
  startTime: '',
  endTime: '',
  batchSize: 500,
  batchNumber: 1,
  totalBatches: 1,
  totalMarks: 100,
  passingMarks: 40,
  negativeMarking: false,
  negativeMarkValue: 0.25,
  shuffleQuestions: true,
  shuffleOptions: true,
  showQuestionNumbers: true,
  maxAttempts: 1,
  allowReview: true,
  showCorrectAnswers: false,
  showExplanations: false,
  calculatorType: 'none',
  requireFullscreen: true,
  detectTabSwitch: true,
  detectCopyPaste: true,
  maxViolations: 5,
  blockRightClick: true,
};

export default function CreateExamPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ExamSettings>(defaultSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverTime, setServerTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await api.get('/admin/server-time');
        setServerTime(new Date(res.data.data?.serverTime || Date.now()));
      } catch {
        setServerTime(new Date());
      }
    };
    fetchServerTime();
    const timer = setInterval(() => {
      setServerTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateSettings = <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!settings.title.trim()) {
      toast.error('Examination title is required');
      setActiveTab('general');
      return;
    }
    if (!settings.subject) {
      toast.error('Subject is required');
      setActiveTab('general');
      return;
    }
    if (!settings.startTime || !settings.endTime) {
      toast.error('Examination window (start and end time) is required');
      setActiveTab('timing');
      return;
    }
    if (new Date(settings.startTime) >= new Date(settings.endTime)) {
      toast.error('End time must be after start time');
      setActiveTab('timing');
      return;
    }
    if (settings.batchSize > 500) {
      toast.error('Batch size cannot exceed 500 students');
      setActiveTab('batch');
      return;
    }

    setIsSubmitting(true);
    try {
      const startISO = new Date(settings.startTime).toISOString();
      const endISO = new Date(settings.endTime).toISOString();

      const examPayload = {
        title: settings.title,
        subject: settings.subject,
        description: settings.description,
        instructions: settings.instructions,
        duration: settings.duration,
        startTime: startISO,
        endTime: endISO,
        maxAttempts: settings.maxAttempts,
        passingMarks: settings.passingMarks,
        negativeMarking: settings.negativeMarking,
        negativeMarkValue: settings.negativeMarking ? settings.negativeMarkValue : 0,
        randomizeQuestions: settings.shuffleQuestions,
        randomizeOptions: settings.shuffleOptions,
        showQuestionNumbers: settings.showQuestionNumbers,
        allowReview: settings.allowReview,
        showCorrectAnswers: settings.showCorrectAnswers,
        showExplanations: settings.showExplanations,
        calculatorType: settings.calculatorType,
        calculatorEnabled: settings.calculatorType !== 'none',
        enableProctoring: settings.requireFullscreen || settings.detectTabSwitch || settings.detectCopyPaste,
        detectTabSwitch: settings.detectTabSwitch,
        detectCopyPaste: settings.detectCopyPaste,
        blockRightClick: settings.blockRightClick,
        maxViolationsBeforeSubmit: settings.maxViolations,
        status,
      };
      
      const response = await api.post('/admin/exams', examPayload);
      
      const examId = response.data.data?.exam?._id || response.data.data?._id;
      toast.success(`Examination ${status === 'draft' ? 'saved as draft' : 'created successfully'}`);
      router.push(`/admin/exams/${examId}/questions/add`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create examination');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    });
  };

  const tabs = [
    { id: 'general', label: 'General Information', icon: Settings },
    { id: 'timing', label: 'Timing & Access', icon: Clock },
    { id: 'batch', label: 'Batch Configuration', icon: Users },
    { id: 'marks', label: 'Marks & Grading', icon: Award },
    { id: 'review', label: 'Review Options', icon: FileCheck },
    { id: 'proctoring', label: 'Proctoring & Security', icon: Shield },
  ];

  return (
    <LMSLayout
      pageTitle="Create New Examination"
      breadcrumbs={[
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Examinations', href: '/admin/exams' },
        { label: 'Create New' }
      ]}
    >
      <div className="max-w-7xl mx-auto pb-24">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Examination</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure parameters for a new assessment.</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md text-sm border border-blue-100 dark:border-blue-800">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Server Time:</span>
            <span className="font-mono">{formatDateTime(serverTime)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <nav className="flex flex-col p-4 gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 p-6 md:p-8">
            <div className="max-w-3xl">
                  
              {/* GENERAL SETTINGS */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">General Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Basic details about the examination.</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Examination Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.title}
                        onChange={(e) => updateSettings('title', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. Mid-Term Examination 2024"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Code</label>
                        <input
                          type="text"
                          value={settings.courseCode}
                          onChange={(e) => updateSettings('courseCode', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="e.g. CS101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={settings.subject}
                          onChange={(e) => updateSettings('subject', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">-- Select Subject --</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="English">English</option>
                          <option value="General Studies">General Studies</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        value={settings.description}
                        onChange={(e) => updateSettings('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Internal notes or brief description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions for Candidates</label>
                      <textarea
                        value={settings.instructions}
                        onChange={(e) => updateSettings('instructions', e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">These instructions will be displayed to candidates before they begin.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TIMING & WINDOW */}
              {activeTab === 'timing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timing & Access</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Set the availability window and duration.</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Students must start the exam within this window. The exam will automatically submit when the duration expires or the window closes, whichever comes first.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.startTime}
                        onChange={(e) => updateSettings('startTime', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.endTime}
                        onChange={(e) => updateSettings('endTime', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-1/2 pt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (in minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={settings.duration}
                      onChange={(e) => updateSettings('duration', parseInt(e.target.value) || 60)}
                      min={1} max={480}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* BATCH SETTINGS */}
              {activeTab === 'batch' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Batch Configuration</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage large groups of students across multiple batches.</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Size Limit</label>
                      <input
                        type="number"
                        value={settings.batchSize}
                        onChange={(e) => updateSettings('batchSize', Math.min(500, parseInt(e.target.value) || 500))}
                        min={1} max={500}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Max 500 students per batch.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Number</label>
                      <input
                        type="number"
                        value={settings.batchNumber}
                        onChange={(e) => updateSettings('batchNumber', parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Batches</label>
                      <input
                        type="number"
                        value={settings.totalBatches}
                        onChange={(e) => updateSettings('totalBatches', parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MARKS & GRADING */}
              {activeTab === 'marks' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Marks & Grading</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure scoring logic and question behavior.</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={settings.totalMarks}
                        onChange={(e) => updateSettings('totalMarks', parseInt(e.target.value) || 100)}
                        min={1}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passing Marks</label>
                      <input
                        type="number"
                        value={settings.passingMarks}
                        onChange={(e) => updateSettings('passingMarks', parseInt(e.target.value) || 40)}
                        min={0}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <input
                        id="negativeMarking"
                        type="checkbox"
                        checked={settings.negativeMarking}
                        onChange={(e) => updateSettings('negativeMarking', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="negativeMarking" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
                        Enable Negative Marking
                      </label>
                    </div>
                    
                    {settings.negativeMarking && (
                      <div className="mt-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Penalty per Wrong Answer</label>
                        <select
                          value={settings.negativeMarkValue}
                          onChange={(e) => updateSettings('negativeMarkValue', parseFloat(e.target.value))}
                          className="w-full sm:w-64 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="0.25">1/4 (0.25)</option>
                          <option value="0.33">1/3 (0.33)</option>
                          <option value="0.5">1/2 (0.50)</option>
                          <option value="1">Full (1.00)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Question Delivery</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="shuffleQuestions" type="checkbox" checked={settings.shuffleQuestions} onChange={(e) => updateSettings('shuffleQuestions', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="shuffleQuestions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Shuffle Question Order</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="shuffleOptions" type="checkbox" checked={settings.shuffleOptions} onChange={(e) => updateSettings('shuffleOptions', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="shuffleOptions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Shuffle Answer Options</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="showQuestionNumbers" type="checkbox" checked={settings.showQuestionNumbers} onChange={(e) => updateSettings('showQuestionNumbers', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showQuestionNumbers" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Show Question Numbers</label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Attempts Allowed</label>
                      <input
                        type="number"
                        value={settings.maxAttempts}
                        onChange={(e) => updateSettings('maxAttempts', Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                        min={1} max={5}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowed Calculator</label>
                      <select
                        value={settings.calculatorType}
                        onChange={(e) => updateSettings('calculatorType', e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="none">None (Disabled)</option>
                        <option value="basic">Basic Calculator</option>
                        <option value="scientific">Scientific Calculator</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* REVIEW OPTIONS */}
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Post-Exam Review</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Control what candidates see after submitting their attempt.</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="allowReview" type="checkbox" checked={settings.allowReview} onChange={(e) => updateSettings('allowReview', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="allowReview" className="font-medium text-gray-700 dark:text-gray-300">Allow Candidates to Review Attempt</label>
                        <p className="text-gray-500">Students can see the questions they answered after submission.</p>
                      </div>
                    </div>

                    {settings.allowReview && (
                      <div className="pl-7 space-y-3 mt-2">
                        <div className="flex items-center">
                          <input
                            id="showCorrectAnswers" type="checkbox" checked={settings.showCorrectAnswers} onChange={(e) => updateSettings('showCorrectAnswers', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="showCorrectAnswers" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Show Correct Answers</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="showExplanations" type="checkbox" checked={settings.showExplanations} onChange={(e) => updateSettings('showExplanations', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="showExplanations" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Show Answer Explanations</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PROCTORING */}
              {activeTab === 'proctoring' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Proctoring & Security</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Strict monitoring features to ensure examination integrity.</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md border border-red-200 dark:border-red-800/50 flex gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="text-sm text-red-800 dark:text-red-300">
                      <strong>High Security Mode:</strong> When these features are enabled, candidate behavior is strictly monitored. Violations are logged and the exam may auto-submit if thresholds are exceeded.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Require Fullscreen Mode</div>
                      <input
                        type="checkbox" checked={settings.requireFullscreen} onChange={(e) => updateSettings('requireFullscreen', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Detect Tab/Window Switching</div>
                      <input
                        type="checkbox" checked={settings.detectTabSwitch} onChange={(e) => updateSettings('detectTabSwitch', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Block Copy & Paste Operations</div>
                      <input
                        type="checkbox" checked={settings.detectCopyPaste} onChange={(e) => updateSettings('detectCopyPaste', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Disable Right-Click Context Menu</div>
                      <input
                        type="checkbox" checked={settings.blockRightClick} onChange={(e) => updateSettings('blockRightClick', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Maximum Violations Allowed</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={settings.maxViolations}
                          onChange={(e) => updateSettings('maxViolations', parseInt(e.target.value) || 5)}
                          min={1} max={20}
                          className="w-24 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm font-semibold"
                        />
                        <span className="text-sm text-gray-500">Auto-submit occurs when limit is reached.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            type="button"
            onClick={() => router.push('/admin/exams')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create & Add Questions'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </LMSLayout>
  );
}
