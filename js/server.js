/*
  =============================================
  سيرفر منصة المتفوقين - بديل Firebase
  =============================================
  طريقة التشغيل:
  1. افتح CMD أو Terminal في نفس الفولدر
  2. اكتب:  node server.js
  3. افتح المتصفح على:  http://localhost:3000
  =============================================
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ===== تهيئة ملف البيانات =====
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const empty = { courses: [], students: [], views: {}, quizzes: [], quiz_results: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), 'utf8');
    return empty;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { courses: [], students: [], views: {}, quizzes: [], quiz_results: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ===== أنواع الملفات =====
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// ===== API Handlers =====
function handleAPI(req, res, pathname, body) {
  const data = loadData();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ===== الكورسات =====
  if (pathname === '/api/courses' && req.method === 'GET') {
    const sorted = [...data.courses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.end(JSON.stringify(sorted));
  }

  if (pathname === '/api/courses' && req.method === 'POST') {
    const course = body;
    if (!course.id) {
      course.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      course.createdAt = new Date().toISOString();
      data.courses.push(course);
    } else {
      const idx = data.courses.findIndex(c => c.id === course.id);
      if (idx !== -1) data.courses[idx] = { ...data.courses[idx], ...course };
      else data.courses.push(course);
    }
    saveData(data);
    return res.end(JSON.stringify({ id: course.id }));
  }

  if (pathname.startsWith('/api/courses/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const course = data.courses.find(c => c.id === id);
    if (!course) { res.statusCode = 404; return res.end(JSON.stringify(null)); }
    return res.end(JSON.stringify(course));
  }

  if (pathname.startsWith('/api/courses/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    data.courses = data.courses.filter(c => c.id !== id);
    saveData(data);
    return res.end(JSON.stringify({ ok: true }));
  }

  // ===== الطلاب =====
  if (pathname === '/api/students' && req.method === 'GET') {
    return res.end(JSON.stringify(data.students));
  }

  if (pathname === '/api/students/register' && req.method === 'POST') {
    const { name, phone, password } = body;
    if (data.students.find(s => s.phone === phone)) {
      return res.end(JSON.stringify({ ok: false, msg: 'رقم الهاتف مسجل مسبقاً' }));
    }
    const student = { id: Date.now().toString(36), name, phone, password, joinedAt: new Date().toISOString() };
    data.students.push(student);
    saveData(data);
    return res.end(JSON.stringify({ ok: true, student: { id: student.id, name, phone } }));
  }

  if (pathname === '/api/students/login' && req.method === 'POST') {
    const { phone, password } = body;
    const student = data.students.find(s => s.phone === phone && s.password === password);
    if (!student) return res.end(JSON.stringify({ ok: false, msg: 'رقم الهاتف أو كلمة المرور غير صحيحة' }));
    return res.end(JSON.stringify({ ok: true, student: { id: student.id, name: student.name, phone: student.phone } }));
  }

  if (pathname.startsWith('/api/students/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const student = data.students.find(s => s.id === id);
    if (!student) { res.statusCode = 404; return res.end(JSON.stringify(null)); }
    return res.end(JSON.stringify({ id: student.id, name: student.name, phone: student.phone }));
  }

  // ===== المشاهدات =====
  if (pathname === '/api/views' && req.method === 'GET') {
    return res.end(JSON.stringify(data.views));
  }

  if (pathname === '/api/views' && req.method === 'POST') {
    const { courseId, lessonId } = body;
    const key = `${courseId}_${lessonId}`;
    data.views[key] = (data.views[key] || 0) + 1;
    saveData(data);
    return res.end(JSON.stringify({ ok: true }));
  }

  if (pathname === '/api/views/total' && req.method === 'GET') {
    const total = Object.values(data.views).reduce((s, v) => s + v, 0);
    return res.end(JSON.stringify({ total }));
  }

  // ===== الامتحانات =====
  if (pathname === '/api/quizzes' && req.method === 'GET') {
    return res.end(JSON.stringify(data.quizzes));
  }

  if (pathname === '/api/quizzes' && req.method === 'POST') {
    const quiz = body;
    if (!quiz.id) {
      quiz.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      data.quizzes.push(quiz);
    } else {
      const idx = data.quizzes.findIndex(q => q.id === quiz.id);
      if (idx !== -1) data.quizzes[idx] = quiz;
      else data.quizzes.push(quiz);
    }
    saveData(data);
    return res.end(JSON.stringify({ id: quiz.id }));
  }

  if (pathname.startsWith('/api/quizzes/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    data.quizzes = data.quizzes.filter(q => q.id !== id);
    saveData(data);
    return res.end(JSON.stringify({ ok: true }));
  }

  if (pathname === '/api/quizzes/by-lesson' && req.method === 'GET') {
    const lessonId = new URLSearchParams(req.url.split('?')[1]).get('lessonId');
    const quiz = data.quizzes.find(q => q.lessonId === lessonId);
    return res.end(JSON.stringify(quiz || null));
  }

  if (pathname === '/api/quizzes/by-course' && req.method === 'GET') {
    const courseId = new URLSearchParams(req.url.split('?')[1]).get('courseId');
    const quiz = data.quizzes.find(q => q.courseId === courseId);
    return res.end(JSON.stringify(quiz || null));
  }

  // ===== نتائج الامتحانات =====
  if (pathname === '/api/quiz-results' && req.method === 'GET') {
    return res.end(JSON.stringify(data.quiz_results));
  }

  if (pathname === '/api/quiz-results' && req.method === 'POST') {
    const result = { ...body, id: Date.now().toString(36), date: new Date().toISOString() };
    data.quiz_results.push(result);
    saveData(data);
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ===== السيرفر الرئيسي =====
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // API routes
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; } catch {}
      handleAPI(req, res, pathname, parsed);
    });
    return;
  }

  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Try with .html extension
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('الصفحة غير موجودة');
      } else {
        res.statusCode = 500;
        res.end('خطأ في السيرفر');
      }
      return;
    }
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'text/plain');
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('✅ السيرفر شغال!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 افتح المتصفح على: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⛔ لإيقاف السيرفر: اضغط Ctrl + C');
  console.log('');
});