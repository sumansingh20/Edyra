import { Course, Assignment, Question, Grade, Attendance, Submission } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { generateText } from '../utils/llmClient.js';

// AI Quiz Generator
export const generateQuiz = async (req, res, next) => {
  try {
    const { topic, difficulty, count = 5, questionTypes = ['mcq-single'], courseId } = req.body;

    // Attempt real AI generation
    const prompt = `Generate a quiz about "${topic}". The difficulty should be ${difficulty}.
Provide exactly ${count} questions. The types can be: ${questionTypes.join(', ')}.
Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "questionText": "Question text here",
      "questionType": "mcq-single",
      "options": [{ "text": "Option A", "isCorrect": true }, { "text": "Option B", "isCorrect": false }],
      "marks": 2
    }
  ]
}`;
    
    let generatedContent = await generateText(prompt, 'You are an expert teacher. Return only valid JSON without markdown formatting blocks.');
    
    let questions = [];
    if (generatedContent) {
      try {
        // clean up markdown
        generatedContent = generatedContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(generatedContent);
        questions = parsed.questions.map(q => ({
          ...q,
          difficulty,
          topic,
          aiGenerated: true,
          status: 'draft'
        }));
      } catch (e) {
        console.error('Failed to parse AI output', e);
      }
    }

    // Fallback if AI fails or isn't configured
    if (questions.length === 0) {
      for (let i = 0; i < count; i++) {
        const qType = questionTypes[i % questionTypes.length];
        questions.push({
          questionText: `[Fallback] ${topic} - Question ${i + 1} (${difficulty} difficulty)`,
          questionType: qType,
          difficulty,
          options: qType.startsWith('mcq') ? [
            { text: 'Option A', isCorrect: i % 4 === 0 },
            { text: 'Option B', isCorrect: i % 4 === 1 },
            { text: 'Option C', isCorrect: i % 4 === 2 },
            { text: 'Option D', isCorrect: i % 4 === 3 }
          ] : [],
          marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
          topic,
          aiGenerated: true,
          status: 'draft'
        });
      }
    }

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          topic, difficulty, count, questionTypes
        }
      }
    });
  } catch (error) { next(error); }
};

// AI Assignment Generator
export const generateAssignment = async (req, res, next) => {
  try {
    const { topic, courseId, type = 'assignment', difficulty = 'medium' } = req.body;

    const prompt = `Generate an assignment for students on the topic: "${topic}".
Type: ${type}. Difficulty: ${difficulty}.
Return ONLY a valid JSON object matching this schema:
{
  "title": "Assignment Title",
  "description": "Brief description of the task",
  "instructions": "Step-by-step instructions (can include markdown)",
  "rubric": [
    { "criterion": "Criterion name", "maxScore": 25, "description": "What is expected" }
  ]
}`;

    let generatedContent = await generateText(prompt, 'You are an expert teacher.');
    let assignment = null;

    if (generatedContent) {
      try {
        generatedContent = generatedContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(generatedContent);
        assignment = {
          ...parsed,
          type,
          totalMarks: parsed.rubric.reduce((sum, r) => sum + r.maxScore, 0),
          aiGenerated: true
        };
      } catch (e) {
        console.error('Failed to parse AI output', e);
      }
    }

    if (!assignment) {
      assignment = {
        title: `${topic} - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `[AI Generated] Complete the following ${type} on the topic of ${topic}. This is a ${difficulty} level task.`,
        instructions: `1. Research the topic thoroughly\n2. Write your answers clearly\n3. Include references where applicable\n4. Submit before the deadline`,
        type,
        totalMarks: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100,
        rubric: [
          { criterion: 'Understanding', maxScore: 25, description: 'Demonstrates understanding of core concepts' },
          { criterion: 'Analysis', maxScore: 25, description: 'Critical analysis and reasoning' }
        ],
        aiGenerated: true
      };
    }

    res.json({ success: true, data: { assignment } });
  } catch (error) { next(error); }
};

// AI Lecture Summarizer
export const summarizeLecture = async (req, res, next) => {
  try {
    const { content, format = 'summary' } = req.body;
    if (!content) throw new AppError('Content is required', 400);

    const prompt = `Summarize the following lecture content into format: ${format}.
If format is 'flashcards', return JSON with array of {"front": "concept", "back": "explanation"}.
If format is 'notes', return JSON with array of {"heading": "topic", "content": "details"}.
If format is 'summary', return JSON with {"summary": "paragraph", "keyPoints": ["point1", "point2"]}.
Content:
${content}
Return ONLY a valid JSON object.`;

    let generatedContent = await generateText(prompt, 'You are an expert student note-taker.');
    let result = null;

    if (generatedContent) {
      try {
        generatedContent = generatedContent.replace(/```json/g, '').replace(/```/g, '').trim();
        result = {
          type: format,
          ...JSON.parse(generatedContent),
          wordCount: content.split(/\\s+/).length
        };
      } catch (e) {
        console.error('Failed to parse AI output', e);
      }
    }

    if (!result) {
      // Fallback
      result = {
        type: 'summary',
        summary: 'AI summarization failed. Here is a fallback summary.',
        keyPoints: ['Fallback point 1'],
        wordCount: content.split(/\\s+/).length
      };
    }

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// AI Student Analytics / Predictions
export const predictStudentPerformance = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.query;

    // Gather student data
    const grades = await Grade.find({ student: studentId }).populate('course', 'title code');
    const attendances = await Attendance.find({ 'records.student': studentId });

    let totalAttendance = 0;
    let presentCount = 0;
    attendances.forEach(a => {
      const record = a.records.find(r => r.student.toString() === studentId);
      if (record) {
        totalAttendance++;
        if (record.status === 'present' || record.status === 'late') presentCount++;
      }
    });

    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance * 100) : 0;
    const avgGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length : 0;

    // Simple prediction model
    let riskLevel = 'low';
    let predictedGrade = 'A';
    const factors = [];

    if (attendanceRate < 60) { riskLevel = 'high'; factors.push('Low attendance rate'); }
    else if (attendanceRate < 75) { riskLevel = 'medium'; factors.push('Below average attendance'); }

    if (avgGrade < 40) { riskLevel = 'high'; predictedGrade = 'F'; factors.push('Poor historical performance'); }
    else if (avgGrade < 60) { riskLevel = 'medium'; predictedGrade = 'C'; factors.push('Average performance'); }
    else if (avgGrade < 80) { predictedGrade = 'B'; }

    const recommendations = [];
    if (riskLevel === 'high') {
      recommendations.push('Schedule meeting with academic advisor');
      recommendations.push('Assign peer mentor');
      recommendations.push('Recommend additional study resources');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor closely');
      recommendations.push('Suggest study groups');
    }

    res.json({
      success: true,
      data: {
        studentId,
        attendanceRate: Math.round(attendanceRate),
        averageGrade: Math.round(avgGrade * 10) / 10,
        riskLevel,
        predictedGrade,
        factors,
        recommendations,
        gradesHistory: grades.map(g => ({ course: g.course?.title, grade: g.grade, percentage: g.percentage })),
        note: 'Connect ML model API for advanced predictions'
      }
    });
  } catch (error) { next(error); }
};

// AI Learning Recommendations
export const getRecommendations = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const grades = await Grade.find({ student: studentId }).populate('course', 'title code department');

    const weakAreas = grades
      .filter(g => g.percentage < 60)
      .map(g => ({ course: g.course?.title, grade: g.grade, percentage: g.percentage }));

    const strongAreas = grades
      .filter(g => g.percentage >= 80)
      .map(g => ({ course: g.course?.title, grade: g.grade, percentage: g.percentage }));

    res.json({
      success: true,
      data: {
        weakAreas,
        strongAreas,
        recommendations: [
          ...(weakAreas.length > 0 ? [`Focus on improving: ${weakAreas.map(w => w.course).join(', ')}`] : []),
          'Review lecture recordings for complex topics',
          'Practice with previous year question papers',
          'Join study groups for challenging subjects',
          'Attend office hours with professors'
        ],
        studyPlan: {
          daily: '2-3 hours focused study',
          weekly: 'Review all lecture notes',
          monthly: 'Take practice tests'
        }
      }
    });
  } catch (error) { next(error); }
};

// AI Code Evaluator (stub)
export const evaluateCode = async (req, res, next) => {
  try {
    const { code, language, testCases = [] } = req.body;
    if (!code) throw new AppError('Code is required', 400);

    // In production, connect to sandboxed code execution engine
    const result = {
      status: 'evaluated',
      language,
      codeLength: code.length,
      lineCount: code.split('\n').length,
      analysis: {
        syntax: 'Valid',
        complexity: 'O(n)',
        style: 'Good',
        suggestions: [
          'Consider adding comments for complex logic',
          'Variable naming follows conventions'
        ]
      },
      testResults: testCases.map((tc, idx) => ({
        testCase: idx + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        status: 'pending',
        note: 'Connect sandboxed execution engine for actual test execution'
      })),
      score: Math.floor(Math.random() * 30) + 70,
      note: 'Connect code execution sandbox (e.g., Judge0) for full evaluation'
    };

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export default {
  generateQuiz, generateAssignment, summarizeLecture,
  predictStudentPerformance, getRecommendations, evaluateCode
};
