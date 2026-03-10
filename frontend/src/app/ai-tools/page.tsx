'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { aiApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

type AiTab = 'quiz-gen' | 'assignment-gen' | 'study-assist' | 'code-eval' | 'predictions';

export default function AIToolsPage() {
  const { user } = useAuthStore();
  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'].includes(user?.role || '');
  const isStudent = user?.role === 'student';

  const allTabs: { key: AiTab; label: string; roles: string[] }[] = [
    { key: 'quiz-gen', label: 'Quiz Generator', roles: ['staff'] },
    { key: 'assignment-gen', label: 'Assignment Generator', roles: ['staff'] },
    { key: 'study-assist', label: 'Study Assistant', roles: ['student', 'staff'] },
    { key: 'code-eval', label: 'Code Evaluator', roles: ['staff'] },
    { key: 'predictions', label: 'AI Predictions', roles: ['staff'] },
  ];
  const visibleTabs = allTabs.filter(t => (isStaff && t.roles.includes('staff')) || (isStudent && t.roles.includes('student')));
  const [tab, setTab] = useState<AiTab>(visibleTabs[0]?.key || 'study-assist');

  return (
    <SidebarLayout pageTitle="AI Tools" breadcrumbs={[{ label: 'EDYRA' }, { label: 'AI Tools' }]}>
      <div className="space-y-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'quiz-gen' && <QuizGenerator />}
        {tab === 'assignment-gen' && <AssignmentGenerator />}
        {tab === 'study-assist' && <StudyAssistant />}
        {tab === 'code-eval' && <CodeEvaluator />}
        {tab === 'predictions' && <Predictions />}
      </div>
    </SidebarLayout>
  );
}

function QuizGenerator() {
  const [form, setForm] = useState({ topic: '', numQuestions: '10', difficulty: 'medium', types: ['mcq-single'] });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleType = (t: string) => setForm(p => ({ ...p, types: p.types.includes(t) ? p.types.filter(x => x !== t) : [...p.types, t] }));

  const generate = async () => {
    if (!form.topic) { toast.error('Enter a topic'); return; }
    try { setLoading(true); const res = await aiApi.generateQuiz({ ...form, numQuestions: parseInt(form.numQuestions) }); setResult(res.data.data); toast.success('Quiz generated!'); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Generation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Quiz Generator</h3>
        <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="Topic (e.g. Binary Trees, Thermodynamics)" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Number of Questions</label>
            <input type="number" min="1" max="50" value={form.numQuestions} onChange={e => setForm(p => ({ ...p, numQuestions: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">Question Types</label>
          <div className="flex flex-wrap gap-2">
            {['mcq-single', 'true-false', 'fill-blank', 'short-answer'].map(t => (
              <button key={t} onClick={() => toggleType(t)} className={`px-3 py-1 text-sm rounded-lg border ${form.types.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>{t}</button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>

      {result?.questions && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Generated Questions ({result.questions.length})</h3>
            <button onClick={() => toast.success('Save to Question Bank coming soon')} className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg">Save to Bank</button>
          </div>
          {result.questions.map((q: any, i: number) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">Q{i + 1}. {q.questionText || q.question}</p>
              {q.options && <ul className="mt-2 space-y-1">{q.options.map((o: any, j: number) => <li key={j} className={`text-sm ${o.isCorrect ? 'text-green-600 font-medium' : 'text-gray-500'}`}>{String.fromCharCode(65 + j)}. {o.text || o}</li>)}</ul>}
              {q.correctAnswer && <p className="mt-2 text-sm text-green-600">Answer: {q.correctAnswer}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentGenerator() {
  const [form, setForm] = useState({ subject: '', topic: '', type: 'homework', difficulty: 'medium', wordCount: '500' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.topic) { toast.error('Enter a topic'); return; }
    try { setLoading(true); const res = await aiApi.generateAssignment(form); setResult(res.data.data); toast.success('Assignment generated!'); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">AI Assignment Generator</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
        <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="Topic" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
          <option value="homework">Homework</option><option value="project">Project</option><option value="research">Research</option>
        </select>
        <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>
      <button onClick={generate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {result.title && <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{result.title}</h4>}
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.description || result.content || JSON.stringify(result, null, 2)}</div>
        </div>
      )}
    </div>
  );
}

function StudyAssistant() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('');

  const handleAction = async (type: string) => {
    if (!text.trim()) { toast.error('Paste some content first'); return; }
    try { setLoading(true); setMode(type); const res = await aiApi.summarize({ text, type }); setResult(res.data.data); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Study Assistant</h3>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste lecture notes, textbook content, or any study material here..." rows={8} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 font-mono" />
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleAction('summary')} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{loading && mode === 'summary' ? 'Processing...' : 'Summarize'}</button>
          <button onClick={() => handleAction('flashcards')} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">{loading && mode === 'flashcards' ? 'Processing...' : 'Generate Flashcards'}</button>
          <button onClick={() => handleAction('keypoints')} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">{loading && mode === 'keypoints' ? 'Processing...' : 'Key Points'}</button>
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{mode === 'summary' ? 'Summary' : mode === 'flashcards' ? 'Flashcards' : 'Key Points'}</h3>
          {mode === 'flashcards' && result.flashcards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.flashcards.map((f: any, i: number) => (
                <div key={i} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Q: {f.front || f.question}</p>
                  <hr className="my-2 border-blue-200 dark:border-blue-700" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">A: {f.back || f.answer}</p>
                </div>
              ))}
            </div>
          ) : mode === 'keypoints' && result.keypoints ? (
            <ul className="space-y-2">
              {result.keypoints.map((k: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-5 h-5 bg-green-100 dark:bg-green-900 text-green-600 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                  {k}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.summary || result.content || JSON.stringify(result, null, 2)}</div>
          )}
        </div>
      )}
    </div>
  );
}

function CodeEvaluator() {
  const [form, setForm] = useState({ language: 'python', code: '', expectedOutput: '', testCases: [{ input: '', expectedOutput: '' }] });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addTestCase = () => setForm(p => ({ ...p, testCases: [...p.testCases, { input: '', expectedOutput: '' }] }));
  const updateTestCase = (i: number, field: string, val: string) => setForm(p => ({ ...p, testCases: p.testCases.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc) }));

  const evaluate = async () => {
    if (!form.code.trim()) { toast.error('Enter code'); return; }
    try { setLoading(true); const res = await aiApi.evaluateCode(form); setResult(res.data.data); toast.success('Evaluation complete'); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Code Evaluator</h3>
        <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
          {['python', 'javascript', 'java', 'c', 'cpp'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <textarea value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="Paste code here..." rows={10} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-900 text-green-400 font-mono" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Cases</label>
            <button onClick={addTestCase} className="text-xs text-blue-600">+ Add</button>
          </div>
          {form.testCases.map((tc, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 mb-2">
              <input value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} placeholder="Input" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 font-mono" />
              <input value={tc.expectedOutput} onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)} placeholder="Expected output" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 font-mono" />
            </div>
          ))}
        </div>
        <button onClick={evaluate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Evaluating...' : 'Evaluate Code'}
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Results</h3>
          {result.score !== undefined && <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">Score: {result.score}%</p>}
          {result.testResults && result.testResults.map((t: any, i: number) => (
            <div key={i} className={`p-3 mb-2 rounded-lg ${t.passed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <span className="text-sm font-medium">{t.passed ? 'PASS' : 'FAIL'} - Test {i + 1}</span>
              {t.output && <p className="text-xs font-mono text-gray-600 mt-1">Output: {t.output}</p>}
            </div>
          ))}
          {result.feedback && <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300">{result.feedback}</div>}
        </div>
      )}
    </div>
  );
}

function Predictions() {
  const [courseId, setCourseId] = useState('');
  const [predictions, setPredictions] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!courseId) { toast.error('Enter course ID'); return; }
    try { setLoading(true); const res = await aiApi.predict({ courseId }); setPredictions(res.data.data); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const getRecs = async () => {
    try { setLoading(true); const res = await aiApi.recommendations(); setRecommendations(res.data.data); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Predictions &amp; Analytics</h3>
        <div className="flex gap-3">
          <input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Course ID" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          <button onClick={analyze} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">Analyze</button>
          <button onClick={getRecs} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">Recommendations</button>
        </div>
      </div>

      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.atRiskStudents && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">At-Risk Students</h4>
              {predictions.atRiskStudents.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.name || s.studentId}</span>
                  <span className="text-xs text-red-600">{s.risk || 'High Risk'}</span>
                </div>
              ))}
            </div>
          )}
          {predictions.insights && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">Insights</h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {Array.isArray(predictions.insights) ? predictions.insights.map((ins: string, i: number) => <p key={i}>- {ins}</p>) : <p>{JSON.stringify(predictions.insights)}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {recommendations && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
          <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">Recommendations</h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations, null, 2)}</div>
        </div>
      )}
    </div>
  );
}
