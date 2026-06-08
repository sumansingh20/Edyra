import api from './api';

// ===== COURSE API =====
export const courseApi = {
  list: (params?: Record<string, any>) => api.get('/courses', { params }),
  get: (id: string) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  enroll: (id: string, studentId?: string) => api.post(`/courses/${id}/enroll`, { studentId }),
  unenroll: (id: string, studentId?: string) => api.post(`/courses/${id}/unenroll`, { studentId }),
  addModule: (id: string, data: any) => api.post(`/courses/${id}/modules`, data),
  updateModule: (id: string, moduleId: string, data: any) => api.put(`/courses/${id}/modules/${moduleId}`, data),
  deleteModule: (id: string, moduleId: string) => api.delete(`/courses/${id}/modules/${moduleId}`),
  addLecture: (id: string, moduleId: string, data: any) => api.post(`/courses/${id}/modules/${moduleId}/lectures`, data),
  completeLecture: (id: string, moduleId: string, lectureId: string) => api.post(`/courses/${id}/modules/${moduleId}/lectures/${lectureId}/complete`),
  getProgress: (id: string) => api.get(`/courses/${id}/progress`),
  addAnnouncement: (id: string, data: any) => api.post(`/courses/${id}/announcements`, data),
};

// ===== ASSIGNMENT API =====
export const assignmentApi = {
  list: (params?: Record<string, any>) => api.get('/assignments', { params }),
  get: (id: string) => api.get(`/assignments/${id}`),
  create: (data: any) => api.post('/assignments', data),
  update: (id: string, data: any) => api.put(`/assignments/${id}`, data),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  submit: (id: string, data: any) => api.post(`/assignments/${id}/submit`, data),
  getSubmissions: (id: string, params?: Record<string, any>) => api.get(`/assignments/${id}/submissions`, { params }),
  grade: (submissionId: string, data: any) => api.put(`/assignments/submissions/${submissionId}/grade`, data),
  requestResubmit: (submissionId: string, data?: any) => api.post(`/assignments/submissions/${submissionId}/resubmit`, data),
};

// ===== GRADEBOOK API =====
export const gradebookApi = {
  myGrades: (params?: Record<string, any>) => api.get('/gradebook/my', { params }),
  getDetails: (id: string) => api.get(`/gradebook/${id}`),
  courseGradebook: (courseId: string, params?: Record<string, any>) => api.get(`/gradebook/course/${courseId}`, { params }),
  upsert: (data: any) => api.post('/gradebook', data),
  addComponent: (id: string, data: any) => api.post(`/gradebook/${id}/component`, data),
  finalize: (data: any) => api.post('/gradebook/finalize', data),
  publish: (data: any) => api.post('/gradebook/publish', data),
  transcript: (studentId?: string) => api.get(studentId ? `/gradebook/transcript/${studentId}` : '/gradebook/transcript'),
};

// ===== ATTENDANCE API =====
export const attendanceApi = {
  list: (params?: Record<string, any>) => api.get('/attendance', { params }),
  mark: (data: any) => api.post('/attendance/mark', data),
  generateQR: (data: any) => api.post('/attendance/qr/generate', data),
  markViaQR: (qrCode: string) => api.post('/attendance/qr/mark', { qrCode }),
  markViaGPS: (data: any) => api.post('/attendance/gps/mark', data),
  summary: (studentId?: string) => api.get(studentId ? `/attendance/summary/${studentId}` : '/attendance/summary'),
};

// ===== COMMUNICATION API =====
export const forumApi = {
  getThreads: (params?: Record<string, any>) => api.get('/communication/forum/threads', { params }),
  getThread: (id: string) => api.get(`/communication/forum/threads/${id}`),
  createThread: (data: any) => api.post('/communication/forum/threads', data),
  reply: (id: string, data: any) => api.post(`/communication/forum/threads/${id}/reply`, data),
  upvote: (id: string) => api.post(`/communication/forum/threads/${id}/upvote`),
};

export const messageApi = {
  getConversations: () => api.get('/communication/messages/conversations'),
  getMessages: (conversationId: string, params?: Record<string, any>) => api.get(`/communication/messages/${conversationId}`, { params }),
  send: (data: any) => api.post('/communication/messages', data),
};

export const announcementApi = {
  list: (params?: Record<string, any>) => api.get('/communication/announcements', { params }),
  create: (data: any) => api.post('/communication/announcements', data),
  update: (id: string, data: any) => api.put(`/communication/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/communication/announcements/${id}`),
};

export const notificationApi = {
  list: (params?: Record<string, any>) => api.get('/communication/notifications', { params }),
  markRead: (id: string) => api.put(`/communication/notifications/${id}/read`),
  markAllRead: () => api.put('/communication/notifications/read-all'),
};

// ===== AI API =====
export const aiApi = {
  generateQuiz: (data: any) => api.post('/ai/generate-quiz', data),
  generateAssignment: (data: any) => api.post('/ai/generate-assignment', data),
  summarize: (data: any) => api.post('/ai/summarize', data),
  predict: (params: Record<string, any>) => api.get('/ai/predict', { params }),
  recommendations: () => api.get('/ai/recommendations'),
  evaluateCode: (data: any) => api.post('/ai/evaluate-code', data),
};

// ===== ERP API =====
export const erpApi = {
  // Admissions
  getAdmissions: (params?: Record<string, any>) => api.get('/erp/admissions', { params }),
  getAdmission: (id: string) => api.get(`/erp/admissions/${id}`),
  createAdmission: (data: any) => api.post('/erp/admissions', data),
  updateAdmissionStatus: (id: string, data: any) => api.put(`/erp/admissions/${id}/status`, data),
  // Fees
  getFees: (params?: Record<string, any>) => api.get('/erp/fees', { params }),
  createFee: (data: any) => api.post('/erp/fees', data),
  recordPayment: (id: string, data: any) => api.post(`/erp/fees/${id}/payment`, data),
  // Timetable
  getTimetables: (params?: Record<string, any>) => api.get('/erp/timetable', { params }),
  createTimetable: (data: any) => api.post('/erp/timetable', data),
  updateTimetable: (id: string, data: any) => api.put(`/erp/timetable/${id}`, data),
  // Library
  getBooks: (params?: Record<string, any>) => api.get('/erp/library', { params }),
  addBook: (data: any) => api.post('/erp/library', data),
  issueBook: (id: string, data: any) => api.post(`/erp/library/${id}/issue`, data),
  returnBook: (id: string, data: any) => api.post(`/erp/library/${id}/return`, data),
  // Hostel
  getHostelRooms: (params?: Record<string, any>) => api.get('/erp/hostel', { params }),
  createHostelRoom: (data: any) => api.post('/erp/hostel', data),
  allocateRoom: (id: string, data: any) => api.post(`/erp/hostel/${id}/allocate`, data),
  vacateRoom: (id: string, data: any) => api.post(`/erp/hostel/${id}/vacate`, data),
  // Transport
  getRoutes: (params?: Record<string, any>) => api.get('/erp/transport', { params }),
  createRoute: (data: any) => api.post('/erp/transport', data),
  updateRoute: (id: string, data: any) => api.put(`/erp/transport/${id}`, data),
  assignStudentToRoute: (id: string, data: any) => api.post(`/erp/transport/${id}/assign`, data),
};

// ===== ANALYTICS API =====
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  course: (courseId: string) => api.get(`/analytics/course/${courseId}`),
  student: (studentId?: string) => api.get(studentId ? `/analytics/student/${studentId}` : '/analytics/student'),
  institution: () => api.get('/analytics/institution'),
  teacher: (teacherId?: string) => api.get(teacherId ? `/analytics/teacher/${teacherId}` : '/analytics/teacher'),
};
