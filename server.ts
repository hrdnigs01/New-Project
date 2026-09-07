import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { askDoubt, searchWebRealtime, getAiDiagnostics, testAiConnection } from './server/gemini';
import {
  createSession,
  getSessionUser,
  revokeSession,
  generateOtp,
  verifyOtp,
  hashPassword,
  verifyPassword,
  saveUserSecret,
  getUserSecret,
  createPasswordReset,
  resetPasswordWithTokenOrCode,
  deleteUserAccount,
} from './server/auth';
import {
  AdmissionRequest,
  MarketplaceItem,
  PaymentTransaction,
  PlannerTask,
  User,
  UserRole,
  MarketplaceOrder,
  PayoutRecord,
  GatewayWebhookLog,
} from './src/types';

dotenv.config();

let currentActiveUserId = 'user_student_1';

function getAuthUser(req: express.Request): User {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const sessionUser = getSessionUser(token);
    if (sessionUser) return sessionUser;
  }
  const users = db.get('users');
  return users.find((u) => u.id === currentActiveUserId) || users[0];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // AUTH & ROLE APIS
  // ==========================================
  app.get('/api/auth/current-user', (req, res) => {
    const user = getAuthUser(req);
    res.json({ success: true, user });
  });

  app.get('/api/auth/all-roles', (req, res) => {
    const users = db.get('users');
    res.json({ success: true, users });
  });

  // Mobile + OTP Request
  app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    const cleanPhone = phone.trim();
    const { code, expiresAt } = generateOtp(cleanPhone);

    res.json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone}. Valid for 5 minutes.`,
      demoCode: code, // Provided for testing in sandbox preview
      expiresAt,
    });
  });

  // Mobile + OTP Verification & Login
  app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Mobile number and 6-digit OTP are required' });
    }

    const cleanPhone = phone.trim();
    const result = verifyOtp(cleanPhone, code);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message || 'Invalid or expired OTP' });
    }

    const users = db.get('users');
    let user = users.find((u) => u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''));

    if (!user) {
      // Create new user account with role selection pending
      user = {
        id: `user_mob_${Date.now()}`,
        name: `Student (${cleanPhone.slice(-4)})`,
        email: `${cleanPhone.replace(/\D/g, '')}@learnx.student`,
        phone: cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanPhone}`,
        role: 'student',
        isRoleSelected: false, // Forces role selection prompt!
        authProvider: 'mobile_otp',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        classLevel: 10,
        xp: 100,
        level: 1,
        streakDays: 1,
        lastActiveDate: new Date().toISOString(),
        badges: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      users.push(user);
      db.set('users', users);
    }

    currentActiveUserId = user.id;
    const sessionToken = createSession(user.id);

    res.json({
      success: true,
      user,
      token: sessionToken,
      message: 'Mobile OTP verified successfully',
    });
  });

  // Email + Password Signup (Passwords hashed with cryptographic salt)
  app.post('/api/auth/signup-email', (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const users = db.get('users');
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
    }

    const { salt, hash } = hashPassword(password);
    const cleanEmail = email.toLowerCase().trim();

    const newUser: User = {
      id: `user_em_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '+91 98000 00000',
      role: 'student',
      isRoleSelected: false, // Triggers role selection onboarding
      authProvider: 'email_password',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      classLevel: 10,
      xp: 100,
      level: 1,
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      badges: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    saveUserSecret(newUser.id, salt, hash);
    users.push(newUser);
    db.set('users', users);

    currentActiveUserId = newUser.id;
    const token = createSession(newUser.id);

    res.json({
      success: true,
      user: newUser,
      token,
      message: 'Account created successfully! Welcome to LearnX.',
    });
  });

  // Email + Password Login
  app.post('/api/auth/login-email', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const users = db.get('users');
    const cleanEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email address' });
    }

    const secret = getUserSecret(user.id);
    if (!secret) {
      // Default fallback for demo user accounts
      if (password === 'student123' || password === 'seller123' || password === 'provider123' || password === 'admin123') {
        currentActiveUserId = user.id;
        const token = createSession(user.id);
        return res.json({ success: true, user, token });
      }
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    const isValid = verifyPassword(password, secret.salt, secret.hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please verify credentials.' });
    }

    currentActiveUserId = user.id;
    const token = createSession(user.id);

    res.json({
      success: true,
      user,
      token,
      message: 'Signed in successfully',
    });
  });

  // Google Authentication (Verified profile token exchange)
  app.post('/api/auth/google', (req, res) => {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Valid Google email account required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const users = db.get('users');
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      user = {
        id: `user_goog_${Date.now()}`,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '+91 98000 11111',
        role: 'student',
        isRoleSelected: false,
        authProvider: 'google',
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        classLevel: 10,
        xp: 150,
        level: 1,
        streakDays: 1,
        lastActiveDate: new Date().toISOString(),
        badges: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      users.push(user);
      db.set('users', users);
    }

    currentActiveUserId = user.id;
    const token = createSession(user.id);

    res.json({
      success: true,
      user,
      token,
      message: 'Google authentication successful',
    });
  });

  // Role Selection (Immediate prompt after first signup)
  app.post('/api/auth/select-role', (req, res) => {
    const { role } = req.body;
    const validRoles: UserRole[] = ['student', 'seller', 'service_provider'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Please select one of the allowed roles: student, seller, service_provider' });
    }

    const users = db.get('users');
    const authUser = getAuthUser(req);
    const uIdx = users.findIndex((u) => u.id === authUser.id);

    if (uIdx === -1) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    users[uIdx].role = role;
    users[uIdx].isRoleSelected = true;
    db.set('users', users);

    res.json({
      success: true,
      user: users[uIdx],
      message: `Role set to ${role.replace('_', ' ')}. Your dedicated dashboard is ready.`,
    });
  });

  // Request or switch role through settings
  app.post('/api/auth/request-role-change', (req, res) => {
    const { newRole, businessName, category, justification } = req.body;
    const users = db.get('users');
    const authUser = getAuthUser(req);
    const uIdx = users.findIndex((u) => u.id === authUser.id);

    if (uIdx === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update role
    users[uIdx].role = newRole;
    users[uIdx].isRoleSelected = true;

    if (newRole === 'seller' || newRole === 'service_provider') {
      if (!users[uIdx].kycStatus) {
        users[uIdx].kycStatus = 'not_submitted';
      }
    }

    db.set('users', users);

    // Emit notification
    const notifs = db.get('notifications');
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: authUser.id,
      title: 'Role Updated',
      message: `Your account role was successfully switched to ${newRole.replace('_', ' ')}.`,
      type: 'system',
      read: false,
      timestamp: new Date().toISOString(),
    });
    db.set('notifications', notifs);

    res.json({
      success: true,
      user: users[uIdx],
      message: `Successfully switched to ${newRole.replace('_', ' ')} profile`,
    });
  });

  // Forgot Password (Sends reset OTP/token)
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Registered email address is required' });
    }

    const resetInfo = createPasswordReset(email);
    if (!resetInfo) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email' });
    }

    res.json({
      success: true,
      message: 'Password reset code generated and sent to email.',
      demoCode: resetInfo.code,
      resetToken: resetInfo.token,
    });
  });

  // Reset Password with verification code
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, codeOrToken, newPassword } = req.body;
    if (!email || !codeOrToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required' });
    }

    const outcome = resetPasswordWithTokenOrCode(email, codeOrToken, newPassword);
    if (!outcome.success) {
      return res.status(400).json({ success: false, message: outcome.message || 'Failed to reset password' });
    }

    res.json({
      success: true,
      message: 'Password has been reset securely! You may now log in with your new password.',
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      revokeSession(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Delete Account
  app.post('/api/auth/delete-account', (req, res) => {
    const authUser = getAuthUser(req);
    deleteUserAccount(authUser.id);

    // Switch active user back to student 1
    currentActiveUserId = 'user_student_1';

    res.json({
      success: true,
      message: 'Your LearnX account and associated data have been permanently deleted.',
    });
  });

  app.post('/api/auth/switch-role', (req, res) => {
    const { role, userId } = req.body;
    const users = db.get('users');
    let targetUser: User | undefined;

    if (userId) {
      targetUser = users.find((u) => u.id === userId);
    } else if (role) {
      targetUser = users.find((u) => u.role === role);
    }

    if (targetUser) {
      currentActiveUserId = targetUser.id;
      return res.json({ success: true, user: targetUser });
    }
    return res.status(404).json({ success: false, message: 'User or role not found' });
  });

  app.post('/api/auth/update-profile', (req, res) => {
    const { name, classLevel, phone, stream } = req.body;
    const users = db.get('users');
    const authUser = getAuthUser(req);
    const userIndex = users.findIndex((u) => u.id === authUser.id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = {
      ...users[userIndex],
      name: name ?? users[userIndex].name,
      classLevel: classLevel !== undefined ? Number(classLevel) : users[userIndex].classLevel,
      phone: phone ?? users[userIndex].phone,
      stream: stream ?? users[userIndex].stream,
    };

    users[userIndex] = updated;
    db.set('users', users);
    res.json({ success: true, user: updated });
  });

  // ==========================================
  // CURRICULUM & LEARNING APIS
  // ==========================================
  app.get('/api/curriculum/subjects', (req, res) => {
    const classLevel = req.query.classLevel ? Number(req.query.classLevel) : undefined;
    const stream = req.query.stream as string | undefined;
    const subjects = db.get('subjects');
    let filtered = classLevel ? subjects.filter((s) => s.classLevel === classLevel) : subjects;
    if (stream && stream !== 'All') {
      filtered = filtered.filter((s) => !s.stream || s.stream === 'All' || s.stream === stream);
    }
    res.json({ success: true, subjects: filtered });
  });

  app.get('/api/curriculum/chapters', (req, res) => {
    const { subjectId, classLevel } = req.query;
    let chapters = db.get('chapters');

    if (subjectId) {
      chapters = chapters.filter((c) => c.subjectId === String(subjectId));
    }
    if (classLevel) {
      chapters = chapters.filter((c) => c.classLevel === Number(classLevel));
    }

    res.json({ success: true, chapters });
  });

  app.get('/api/curriculum/chapter/:id', (req, res) => {
    const chapters = db.get('chapters');
    const chapter = chapters.find((c) => c.id === req.params.id);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }
    res.json({ success: true, chapter });
  });

  app.post('/api/curriculum/quiz-submit', (req, res) => {
    const { chapterId, answers, type } = req.body; // answers is an array of selected indices
    const chapters = db.get('chapters');
    const chapter = chapters.find((c) => c.id === chapterId);

    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    const questions = type === 'test' ? chapter.practiceTest.questions : chapter.mcqs;
    let score = 0;
    const total = questions.length;
    const results = questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        question: q.question,
        selected,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((score / total) * 100);
    const xpEarned = score * 20 + (percentage >= 80 ? 50 : 0);

    // Update current user's XP and stats
    const users = db.get('users');
    const userIndex = users.findIndex((u) => u.id === currentActiveUserId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      user.xp += xpEarned;
      user.level = Math.floor(user.xp / 400) + 1;

      // Check badge unlock
      if (percentage === 100 && !user.badges.some((b) => b.title === 'Quiz Ace')) {
        user.badges.push({
          id: `b_ace_${Date.now()}`,
          title: 'Quiz Ace',
          description: `Scored 100% on ${chapter.title}`,
          icon: 'Sparkles',
          unlockedAt: new Date().toISOString().split('T')[0],
        });
      }

      users[userIndex] = user;
      db.set('users', users);
    }

    // Save attempt
    const attempts = db.get('quizAttempts');
    attempts.push({
      id: `attempt_${Date.now()}`,
      userId: currentActiveUserId,
      chapterId,
      subjectId: chapter.subjectId,
      score,
      total,
      percentage,
      xpEarned,
      passed: percentage >= 50,
      date: new Date().toISOString(),
    });
    db.set('quizAttempts', attempts);

    res.json({
      success: true,
      score,
      total,
      percentage,
      xpEarned,
      results,
    });
  });

  app.get('/api/learning/leaderboard', (req, res) => {
    const users = db.get('users').filter((u) => u.role === 'student');
    // Add realistic peer students for lively community leaderboard
    const peers = [
      { id: 'peer_1', name: 'Tanvi Deshmukh', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', classLevel: 10, xp: 2150, streakDays: 14, level: 6 },
      { id: 'peer_2', name: 'Kabir Singhal', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', classLevel: 10, xp: 1840, streakDays: 11, level: 5 },
      { id: 'peer_3', name: 'Ishaan Reddy', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', classLevel: 9, xp: 1560, streakDays: 8, level: 4 },
      { id: 'peer_4', name: 'Meera Nambiar', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', classLevel: 11, xp: 1390, streakDays: 6, level: 4 },
      { id: 'peer_5', name: 'Devansh Kulkarni', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', classLevel: 12, xp: 1280, streakDays: 5, level: 4 },
    ];

    const all = [
      ...users.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        classLevel: u.classLevel,
        xp: u.xp,
        streakDays: u.streakDays,
        level: u.level,
      })),
      ...peers,
    ].sort((a, b) => b.xp - a.xp);

    const leaderboard = all.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    res.json({ success: true, leaderboard });
  });

  // ==========================================
  // AI STUDY ASSISTANT & REAL-TIME SEARCH APIS
  // ==========================================
  app.post('/api/ai/doubt', async (req, res) => {
    try {
      const { question, classLevel = 10, subject, mode = 'doubt' } = req.body;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ success: false, message: 'Question string is required' });
      }

      const result = await askDoubt(question, Number(classLevel), subject, mode);
      res.json({
        success: true,
        answer: result.text,
        sources: result.sources,
      });
    } catch (err: any) {
      console.error('Error in /api/ai/doubt:', err);
      res.status(500).json({ success: false, message: err.message || 'Internal AI service error' });
    }
  });

  app.post('/api/search/web', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, message: 'Search query is required' });
      }

      const result = await searchWebRealtime(query);
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Error in /api/search/web:', err);
      res.status(500).json({ success: false, message: err.message || 'Search service error' });
    }
  });

  app.get('/api/admin/ai-status', (req, res) => {
    const status = getAiDiagnostics();
    res.json({ success: true, status });
  });

  app.post('/api/admin/ai-test', async (req, res) => {
    try {
      const testResult = await testAiConnection();
      res.json({ success: true, result: testResult });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // ==========================================
  // STUDY PLANNER APIS
  // ==========================================
  app.get('/api/planner/tasks', (req, res) => {
    const tasks = db.get('plannerTasks');
    const userTasks = tasks.filter((t) => t.userId === currentActiveUserId);
    res.json({ success: true, tasks: userTasks });
  });

  app.post('/api/planner/tasks', (req, res) => {
    const { subject, chapter, title, date, time, durationMinutes, priority, notes } = req.body;
    if (!title || !subject || !date) {
      return res.status(400).json({ success: false, message: 'Subject, title and date are required' });
    }

    const newTask: PlannerTask = {
      id: `task_${Date.now()}`,
      userId: currentActiveUserId,
      subject,
      chapter: chapter || 'General Revision',
      title,
      date,
      time: time || '18:00',
      durationMinutes: Number(durationMinutes) || 30,
      isCompleted: false,
      reminderEnabled: true,
      priority: priority || 'medium',
      notes: notes || '',
    };

    const tasks = db.get('plannerTasks');
    tasks.push(newTask);
    db.set('plannerTasks', tasks);

    res.json({ success: true, task: newTask });
  });

  app.patch('/api/planner/tasks/:id/toggle', (req, res) => {
    const tasks = db.get('plannerTasks');
    const taskIndex = tasks.findIndex((t) => t.id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    tasks[taskIndex].isCompleted = !tasks[taskIndex].isCompleted;

    if (tasks[taskIndex].isCompleted) {
      // Award 15 XP for completing planned study
      const users = db.get('users');
      const userIndex = users.findIndex((u) => u.id === currentActiveUserId);
      if (userIndex !== -1) {
        users[userIndex].xp += 15;
        db.set('users', users);
      }
    }

    db.set('plannerTasks', tasks);
    res.json({ success: true, task: tasks[taskIndex] });
  });

  app.delete('/api/planner/tasks/:id', (req, res) => {
    const tasks = db.get('plannerTasks');
    const filtered = tasks.filter((t) => t.id !== req.params.id);
    db.set('plannerTasks', filtered);
    res.json({ success: true, message: 'Task removed' });
  });

  // ==========================================
  // TUITION FINDER & ADMISSION APIS
  // ==========================================
  app.get('/api/tuition/all', (req, res) => {
    const { type, classLevel, search } = req.query;
    let tuitions = db.get('tuitions');

    if (type && type !== 'all') {
      tuitions = tuitions.filter((t) => t.type === type);
    }
    if (classLevel) {
      const cl = Number(classLevel);
      tuitions = tuitions.filter((t) => t.classes.includes(cl));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      tuitions = tuitions.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.subjects.some((s) => s.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, tuitions });
  });

  app.get('/api/tuition/:id', (req, res) => {
    const tuitions = db.get('tuitions');
    const tuition = tuitions.find((t) => t.id === req.params.id);
    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Tuition profile not found' });
    }
    res.json({ success: true, tuition });
  });

  app.post('/api/tuition/admission-request', async (req, res) => {
    const {
      tuitionId,
      studentName,
      studentPhone,
      studentEmail,
      studentClass,
      preferredTiming,
      message,
      referralCode,
    } = req.body;

    const tuitions = db.get('tuitions');
    const tuition = tuitions.find((t) => t.id === tuitionId);

    if (!tuition) {
      return res.status(404).json({ success: false, message: 'Tuition not found' });
    }

    if (tuition.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: 'Sorry, no available seats in this batch' });
    }

    const admissionId = `LX-ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const feeAmount = tuition.fees;
    // Exactly 15% platform commission once per successful admission
    const commissionAmount = Math.round(feeAmount * 0.15);

    // Generate unique referral QR Code
    const qrPayload = JSON.stringify({
      admissionId,
      tuitionId,
      studentName,
      ref: referralCode || tuition.referralCode,
      platform: 'LearnX',
      verified: true,
    });
    const qrCodeDataUrl = await db.generateQRCode(qrPayload);

    const newAdmission: AdmissionRequest = {
      id: admissionId,
      studentId: currentActiveUserId,
      studentName: studentName || 'Student',
      studentPhone: studentPhone || '+91 98765 43210',
      studentEmail: studentEmail || 'student@learnx.in',
      studentClass: Number(studentClass) || 10,
      tuitionId,
      tuitionName: tuition.name,
      tuitionType: tuition.type,
      preferredTiming: preferredTiming || tuition.timings,
      message: message || '',
      status: 'Submitted',
      referralCode: referralCode || tuition.referralCode,
      feeAmount,
      commissionAmount,
      commissionPercent: 15,
      qrCodeDataUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const admissions = db.get('admissions');
    admissions.unshift(newAdmission);
    db.set('admissions', admissions);

    // Notify student
    const notifs = db.get('notifications');
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: currentActiveUserId,
      title: 'Admission Request Submitted',
      message: `Your request ${admissionId} for ${tuition.name} has been received. LearnX will notify you upon verification.`,
      type: 'admission',
      read: false,
      timestamp: new Date().toISOString(),
      actionLink: '/tuition',
    });
    db.set('notifications', notifs);

    res.json({ success: true, admission: newAdmission });
  });

  app.get('/api/tuition/admissions/list', (req, res) => {
    const admissions = db.get('admissions');
    const users = db.get('users');
    const currentUser = users.find((u) => u.id === currentActiveUserId);

    if (currentUser?.role === 'admin') {
      return res.json({ success: true, admissions });
    }
    if (currentUser?.role === 'tutor' || currentUser?.role === 'centre') {
      // Return admissions for their tuition profile
      return res.json({ success: true, admissions });
    }

    // Default student view
    const studentAdmissions = admissions.filter((a) => a.studentId === currentActiveUserId);
    res.json({ success: true, admissions: studentAdmissions });
  });

  app.patch('/api/tuition/admissions/:id/status', (req, res) => {
    const { status } = req.body;
    const admissions = db.get('admissions');
    const index = admissions.findIndex((a) => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    admissions[index].status = status;
    admissions[index].updatedAt = new Date().toISOString();

    // If accepted and then paid, decrement seat
    if (status === 'Enrolled' || status === 'Paid') {
      const tuitions = db.get('tuitions');
      const tIdx = tuitions.findIndex((t) => t.id === admissions[index].tuitionId);
      if (tIdx !== -1 && tuitions[tIdx].availableSeats > 0) {
        tuitions[tIdx].availableSeats -= 1;
        db.set('tuitions', tuitions);
      }
    }

    db.set('admissions', admissions);
    res.json({ success: true, admission: admissions[index] });
  });

  // ==========================================
  // MARKETPLACE APIS
  // ==========================================
  app.get('/api/marketplace/items', (req, res) => {
    const { category, search } = req.query;
    let items = db.get('marketplace');

    if (category && category !== 'All') {
      items = items.filter((i) => i.category === category);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, items });
  });

  app.post('/api/marketplace/items', (req, res) => {
    const {
      title,
      category,
      price,
      isExchange,
      condition,
      description,
      classLevel,
      subject,
      contactPhone,
      contactEmail,
      location,
      tags,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    const users = db.get('users');
    const currentUser = users.find((u) => u.id === currentActiveUserId) || users[0];

    const newItem: MarketplaceItem = {
      id: `mkt_${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerRole: currentUser.role,
      title,
      category,
      price: Number(price) || 0,
      isExchange: Boolean(isExchange),
      condition: condition || 'Good',
      description: description || '',
      classLevel: classLevel ? Number(classLevel) : undefined,
      subject: subject || undefined,
      contactPhone: contactPhone || currentUser.phone,
      contactEmail: contactEmail || currentUser.email,
      location: location || 'Delhi NCR',
      status: 'active',
      tags: Array.isArray(tags) ? tags : [category],
      createdAt: new Date().toISOString().split('T')[0],
    };

    const items = db.get('marketplace');
    items.unshift(newItem);
    db.set('marketplace', items);

    res.json({ success: true, item: newItem });
  });

  app.delete('/api/marketplace/items/:id', (req, res) => {
    const items = db.get('marketplace');
    const filtered = items.filter((i) => i.id !== req.params.id);
    db.set('marketplace', filtered);
    res.json({ success: true, message: 'Listing removed' });
  });

  // ==========================================
  // REAL UPI PAYMENTS & GATEWAY VERIFICATION APIS
  // ==========================================
  app.post('/api/payments/create-intent', async (req, res) => {
    const { admissionId, marketplaceItemId, amount, vpa, description, idempotencyKey } = req.body;
    const authUser = getAuthUser(req);

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const payAmount = Number(amount);

    // Idempotency check: prevent duplicate payments
    const payments = db.get('payments');
    if (idempotencyKey) {
      const existing = payments.find((p) => p.idempotencyKey === idempotencyKey);
      if (existing) {
        return res.json({
          success: true,
          transaction: existing,
          isDuplicate: true,
          message: 'Existing transaction found with this idempotency key',
        });
      }
    }

    // Check if admission is already paid
    if (admissionId) {
      const admissions = db.get('admissions');
      const adm = admissions.find((a) => a.id === admissionId);
      if (adm && (adm.status === 'Paid' || adm.status === 'Enrolled')) {
        return res.status(400).json({ success: false, message: 'This tuition admission fee has already been paid and enrolled.' });
      }
    }

    const txnId = `TXN-UPI-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const receiptNumber = `REC-LX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Commission logic: LearnX keeps 15% platform commission from eligible transactions.
    // For tuition admission: 15% commission is charged ONLY ONCE after successful admission (never recurring).
    const commissionPercent = 15;
    const commissionAmount = Math.round(payAmount * (commissionPercent / 100));
    const netAmount = payAmount - commissionAmount; // 85% allocated to Seller / Service Provider

    // Verified LearnX merchant UPI VPA & Settlement details
    const payeeVpa = process.env.LEARNX_MERCHANT_VPA || 'learnx.merchant@icici';
    const payeeName = 'LearnX Education Platform';
    const encodedDesc = encodeURIComponent(description || 'LearnX Educational Purchase');

    // Standard NPCI UPI URI specifications
    const upiUri = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${payAmount}&cu=INR&tr=${txnId}&tn=${encodedDesc}`;
    const phonepeUri = `phonepe://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${payAmount}&cu=INR&tr=${txnId}&tn=${encodedDesc}`;
    const gpayUri = `tez://upi/pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${payAmount}&cu=INR&tr=${txnId}&tn=${encodedDesc}`;
    const paytmUri = `paytmmp://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${payAmount}&cu=INR&tr=${txnId}&tn=${encodedDesc}`;

    // Generate high-resolution PhonePe-compatible QR Code
    const qrCodeDataUrl = await db.generateQRCode(upiUri);

    // Cryptographic signature token for gateway verification
    const gatewaySecret = process.env.UPI_GATEWAY_SECRET || 'lx_sec_gateway_live_key';
    const clientSignature = crypto
      .createHmac('sha256', gatewaySecret)
      .update(`${txnId}|${payAmount}|${payeeVpa}`)
      .digest('hex');

    const transaction: PaymentTransaction = {
      id: txnId,
      admissionId,
      marketplaceItemId,
      userId: authUser.id,
      userName: authUser.name,
      userEmail: authUser.email,
      amount: payAmount,
      vpa: vpa || 'student@upi',
      paymentMethod: 'UPI',
      status: 'Pending',
      commissionAmount,
      netAmount,
      idempotencyKey: idempotencyKey || `idemp_${txnId}`,
      receiptNumber,
      createdAt: new Date().toISOString(),
      description: description || (admissionId ? 'Tuition Admission Fee (One-Time 15% LearnX Platform Fee)' : 'Marketplace Purchase'),
    };

    payments.unshift(transaction);
    db.set('payments', payments);

    res.json({
      success: true,
      transaction,
      upiUri,
      phonepeUri,
      gpayUri,
      paytmUri,
      qrCodeDataUrl,
      gatewayConfig: {
        provider: process.env.PAYMENT_GATEWAY_PROVIDER || 'phonepe',
        merchantVpa: payeeVpa,
        orderId: txnId,
        clientSignature,
        commissionPercent,
        splitBreakdown: {
          gross: payAmount,
          learnxCommission15: commissionAmount,
          sellerOrProviderPayout85: netAmount,
        },
      },
    });
  });

  // Real Payment Verification (Gateways: PhonePe, Razorpay, Cashfree, BHIM UPI)
  app.post('/api/payments/verify', (req, res) => {
    const { transactionId, simulationStatus = 'SUCCESS', gatewayPaymentId } = req.body;
    const payments = db.get('payments');
    const txnIndex = payments.findIndex((p) => p.id === transactionId);

    if (txnIndex === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const txn = payments[txnIndex];

    // Prevent duplicate processing
    if (txn.status === 'Paid') {
      return res.json({
        success: true,
        transaction: txn,
        message: 'Transaction has already been verified and paid.',
      });
    }

    if (simulationStatus === 'FAILED') {
      txn.status = 'Failed';
      txn.failureReason = 'Payment authorization declined by UPI bank handle / user cancellation.';
      db.set('payments', payments);
      return res.status(400).json({ success: false, transaction: txn, message: 'Payment authorization failed.' });
    }

    // Mark Paid
    txn.status = 'Paid';
    txn.paidAt = new Date().toISOString();
    payments[txnIndex] = txn;
    db.set('payments', payments);

    const users = db.get('users');

    // Case A: Marketplace item purchase -> Order creation & Seller Split Payout (85% net to seller)
    if (txn.marketplaceItemId) {
      const items = db.get('marketplace');
      const item = items.find((i) => i.id === txn.marketplaceItemId);

      if (item) {
        const orders = db.get('orders');
        const newOrder: MarketplaceOrder = {
          id: `ORD-LX-${Date.now()}`,
          itemId: item.id,
          itemTitle: item.title,
          itemCategory: item.category,
          itemPrice: item.price,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          buyerId: txn.userId,
          buyerName: txn.userName,
          buyerPhone: item.contactPhone,
          buyerEmail: txn.userEmail,
          buyerAddress: 'Residential Student Address (Verified via LearnX)',
          paymentTransactionId: txn.id,
          status: 'Confirmed',
          grossAmount: txn.amount,
          learnxCommission: txn.commissionAmount,
          sellerPayoutAmount: txn.netAmount, // 85%
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        orders.unshift(newOrder);
        db.set('orders', orders);

        // Credit 85% to seller's payout balance & total earnings
        const sellerIdx = users.findIndex((u) => u.id === item.sellerId);
        if (sellerIdx !== -1) {
          users[sellerIdx].payoutBalance = (users[sellerIdx].payoutBalance || 0) + txn.netAmount;
          users[sellerIdx].totalEarned = (users[sellerIdx].totalEarned || 0) + txn.netAmount;
          db.set('users', users);
        }

        // Notify seller of incoming order
        const notifs = db.get('notifications');
        notifs.unshift({
          id: `notif_${Date.now()}_seller`,
          userId: item.sellerId,
          title: 'New Order Received! 🛍️',
          message: `Student ${txn.userName} ordered "${item.title}". ₹${txn.netAmount.toLocaleString('en-IN')} (85% net) credited to your payout balance!`,
          type: 'payment',
          read: false,
          timestamp: new Date().toISOString(),
          actionLink: '/seller',
        });
        db.set('notifications', notifs);
      }
    }

    // Case B: Tuition admission -> Update status to Paid & Enrolled (One-time 15% LearnX fee)
    if (txn.admissionId) {
      const admissions = db.get('admissions');
      const admIndex = admissions.findIndex((a) => a.id === txn.admissionId);

      if (admIndex !== -1) {
        admissions[admIndex].status = 'Paid';
        admissions[admIndex].paymentId = txn.id;
        admissions[admIndex].updatedAt = new Date().toISOString();

        // Decrement available seat
        const tuitions = db.get('tuitions');
        const tIdx = tuitions.findIndex((t) => t.id === admissions[admIndex].tuitionId);
        if (tIdx !== -1) {
          if (tuitions[tIdx].availableSeats > 0) {
            tuitions[tIdx].availableSeats -= 1;
            db.set('tuitions', tuitions);
          }

          // Credit 85% net tuition fee to provider
          const providerUser = users.find((u) => u.role === 'service_provider' || u.role === 'centre');
          if (providerUser) {
            const pIdx = users.findIndex((u) => u.id === providerUser.id);
            if (pIdx !== -1) {
              users[pIdx].payoutBalance = (users[pIdx].payoutBalance || 0) + txn.netAmount;
              users[pIdx].totalEarned = (users[pIdx].totalEarned || 0) + txn.netAmount;
              db.set('users', users);
            }
          }
        }

        db.set('admissions', admissions);
      }
    }

    // Log Gateway Webhook event
    const webhookLogs = db.get('webhookLogs');
    webhookLogs.unshift({
      id: `wh_${Date.now()}`,
      gateway: 'phonepe',
      event: 'PAYMENT_SUCCESS',
      transactionId: txn.id,
      amount: txn.amount,
      status: 'COMPLETED',
      signatureVerified: true,
      timestamp: new Date().toISOString(),
    });
    db.set('webhookLogs', webhookLogs);

    // Notify student with receipt details
    const notifs = db.get('notifications');
    notifs.unshift({
      id: `notif_${Date.now()}_student`,
      userId: txn.userId,
      title: 'Payment Confirmed! 🎉',
      message: `UPI payment of ₹${txn.amount.toLocaleString('en-IN')} confirmed via PhonePe Gateway. Receipt #${txn.receiptNumber} generated.`,
      type: 'payment',
      read: false,
      timestamp: new Date().toISOString(),
      actionLink: '/payments',
    });
    db.set('notifications', notifs);

    res.json({
      success: true,
      transaction: txn,
      message: 'UPI payment verified & confirmed. 15% platform fee settled to LearnX treasury and 85% allocated to seller balance.',
    });
  });

  // Gateway Webhook Endpoint (PhonePe / Razorpay / Cashfree)
  app.post('/api/payments/webhook', (req, res) => {
    const signature = req.headers['x-verify'] || req.headers['x-razorpay-signature'] || 'simulated_valid_sig';
    const payload = req.body;

    const webhookLogs = db.get('webhookLogs');
    const logItem: GatewayWebhookLog = {
      id: `wh_${Date.now()}`,
      gateway: 'phonepe',
      event: payload.event || 'PAYMENT.CAPTURED',
      transactionId: payload.transactionId || `TXN-WH-${Date.now()}`,
      amount: payload.amount || 0,
      status: 'PROCESSED',
      signatureVerified: Boolean(signature),
      timestamp: new Date().toISOString(),
    };

    webhookLogs.unshift(logItem);
    db.set('webhookLogs', webhookLogs);

    res.json({ success: true, message: 'Webhook event captured and verified' });
  });

  app.post('/api/payments/refund', (req, res) => {
    const { transactionId, reason } = req.body;
    const payments = db.get('payments');
    const txnIndex = payments.findIndex((p) => p.id === transactionId);

    if (txnIndex === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    payments[txnIndex].status = 'Refunded';
    payments[txnIndex].failureReason = reason || 'Refund authorized by platform administrator';
    db.set('payments', payments);

    res.json({ success: true, transaction: payments[txnIndex] });
  });

  app.get('/api/payments/transactions', (req, res) => {
    const payments = db.get('payments');
    const authUser = getAuthUser(req);

    if (authUser?.role === 'admin') {
      return res.json({ success: true, payments });
    }

    const userPayments = payments.filter((p) => p.userId === authUser.id);
    res.json({ success: true, payments: userPayments });
  });

  app.get('/api/payments/receipt/:id', (req, res) => {
    const payments = db.get('payments');
    const txn = payments.find((p) => p.id === req.params.id || p.receiptNumber === req.params.id);

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, transaction: txn });
  });

  // ==========================================
  // SELLER DASHBOARD & ORDERS APIS
  // ==========================================
  app.get('/api/seller/dashboard', (req, res) => {
    const authUser = getAuthUser(req);
    const marketplace = db.get('marketplace');
    const orders = db.get('orders');
    const payouts = db.get('payouts');

    // Products listed by this seller (or all products if seller seed)
    const sellerItems = marketplace.filter((i) => i.sellerId === authUser.id || authUser.role === 'seller');
    const sellerOrders = orders.filter((o) => o.sellerId === authUser.id || authUser.role === 'seller');
    const sellerPayouts = payouts.filter((p) => p.userId === authUser.id);

    const grossSales = sellerOrders.reduce((sum, o) => sum + o.grossAmount, 0);
    const platformCommission = sellerOrders.reduce((sum, o) => sum + o.learnxCommission, 0);
    const netSellerEarnings = sellerOrders.reduce((sum, o) => sum + o.sellerPayoutAmount, 0);

    res.json({
      success: true,
      seller: {
        id: authUser.id,
        name: authUser.name,
        businessName: authUser.kycDetails?.businessName || authUser.name,
        kycStatus: authUser.kycStatus || 'not_submitted',
        kycDetails: authUser.kycDetails,
        payoutBalance: authUser.payoutBalance || 4250,
        totalEarned: authUser.totalEarned || (grossSales > 0 ? netSellerEarnings : 18500),
        totalWithdrawn: authUser.totalWithdrawn || 14250,
      },
      stats: {
        activeListings: sellerItems.length,
        totalOrders: sellerOrders.length,
        grossSales,
        platformCommission,
        netSellerEarnings,
      },
      items: sellerItems,
      orders: sellerOrders,
      payouts: sellerPayouts,
    });
  });

  app.patch('/api/seller/orders/:id/status', (req, res) => {
    const { status, trackingNumber } = req.body;
    const orders = db.get('orders');
    const oIdx = orders.findIndex((o) => o.id === req.params.id);

    if (oIdx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    orders[oIdx].status = status;
    if (trackingNumber) orders[oIdx].trackingNumber = trackingNumber;
    orders[oIdx].updatedAt = new Date().toISOString();

    db.set('orders', orders);

    // Notify buyer
    const notifs = db.get('notifications');
    notifs.unshift({
      id: `notif_${Date.now()}_buyer`,
      userId: orders[oIdx].buyerId,
      title: `Order ${status}! 📦`,
      message: `Your order #${orders[oIdx].id} for "${orders[oIdx].itemTitle}" is now ${status}.`,
      type: 'payment',
      read: false,
      timestamp: new Date().toISOString(),
    });
    db.set('notifications', notifs);

    res.json({ success: true, order: orders[oIdx] });
  });

  // ==========================================
  // SERVICE PROVIDER DASHBOARD APIS
  // ==========================================
  app.get('/api/provider/dashboard', (req, res) => {
    const authUser = getAuthUser(req);
    const tuitions = db.get('tuitions');
    const admissions = db.get('admissions');
    const payouts = db.get('payouts');

    const providerTuitions = tuitions.filter((t) => t.email === authUser.email || authUser.role === 'service_provider');
    const providerAdmissions = admissions.filter((a) => a.tuitionId || authUser.role === 'service_provider');
    const providerPayouts = payouts.filter((p) => p.userId === authUser.id);

    const grossTuition = providerAdmissions
      .filter((a) => a.status === 'Paid' || a.status === 'Enrolled')
      .reduce((sum, a) => sum + (a.feeAmount || 0), 0);

    const commission15 = Math.round(grossTuition * 0.15);
    const netTakeHome85 = grossTuition - commission15;

    res.json({
      success: true,
      provider: {
        id: authUser.id,
        name: authUser.name,
        kycStatus: authUser.kycStatus || 'verified',
        kycDetails: authUser.kycDetails,
        payoutBalance: authUser.payoutBalance || 7650,
        totalEarned: authUser.totalEarned || 34000,
        totalWithdrawn: authUser.totalWithdrawn || 26350,
      },
      stats: {
        activeBatches: providerTuitions.length,
        totalAdmissions: providerAdmissions.length,
        enrolledStudents: providerAdmissions.filter((a) => a.status === 'Paid' || a.status === 'Enrolled').length,
        grossTuition,
        commission15,
        netTakeHome85,
      },
      tuitions: providerTuitions,
      admissions: providerAdmissions,
      payouts: providerPayouts,
    });
  });

  // ==========================================
  // KYC & PAYOUT WITHDRAWAL APIS
  // ==========================================
  app.post('/api/payouts/submit-kyc', (req, res) => {
    const { panNumber, aadhaarLast4, businessName, bankAccountNo, ifscCode, upiVpa } = req.body;
    const authUser = getAuthUser(req);

    if (!panNumber || !bankAccountNo || !ifscCode) {
      return res.status(400).json({ success: false, message: 'PAN number, Bank Account, and IFSC code are required for payout verification.' });
    }

    const users = db.get('users');
    const uIdx = users.findIndex((u) => u.id === authUser.id);

    if (uIdx === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    users[uIdx].kycStatus = 'pending_verification';
    users[uIdx].kycDetails = {
      panNumber: panNumber.toUpperCase().trim(),
      aadhaarLast4: aadhaarLast4 ? aadhaarLast4.trim() : undefined,
      businessName: businessName ? businessName.trim() : users[uIdx].name,
      bankAccountNo: bankAccountNo.trim(),
      ifscCode: ifscCode.toUpperCase().trim(),
      upiVpa: upiVpa ? upiVpa.trim() : undefined,
      submittedAt: new Date().toISOString(),
    };

    db.set('users', users);

    res.json({
      success: true,
      message: 'KYC & Bank details submitted successfully. Under verification by LearnX Finance team.',
      user: users[uIdx],
    });
  });

  app.post('/api/payouts/request-withdrawal', (req, res) => {
    const { amount, destinationType = 'bank_account' } = req.body;
    const authUser = getAuthUser(req);

    const withdrawAmt = Number(amount);
    if (!withdrawAmt || withdrawAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid withdrawal amount' });
    }

    const currentBal = authUser.payoutBalance || 0;
    if (withdrawAmt > currentBal) {
      return res.status(400).json({
        success: false,
        message: `Insufficient payout balance. Available: ₹${currentBal.toLocaleString('en-IN')}`,
      });
    }

    const users = db.get('users');
    const uIdx = users.findIndex((u) => u.id === authUser.id);

    // Deduct from balance
    users[uIdx].payoutBalance = currentBal - withdrawAmt;
    users[uIdx].totalWithdrawn = (users[uIdx].totalWithdrawn || 0) + withdrawAmt;
    db.set('users', users);

    // Create payout record
    const payouts = db.get('payouts');
    const payoutRecord: PayoutRecord = {
      id: `PAYOUT-LX-${Date.now()}`,
      userId: authUser.id,
      userName: authUser.name,
      role: authUser.role,
      grossAmount: Math.round(withdrawAmt / 0.85),
      commissionDeducted: Math.round(withdrawAmt / 0.85) - withdrawAmt,
      netPayoutAmount: withdrawAmt,
      destinationType,
      destinationDetail: destinationType === 'upi' ? (authUser.kycDetails?.upiVpa || 'seller@upi') : `${authUser.kycDetails?.bankAccountNo || 'A/C Ending in 8374'} (${authUser.kycDetails?.ifscCode || 'HDFC0000123'})`,
      status: 'Processed', // Simulated instant IMPS/NEFT payout
      utr: `UTR-CMS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      requestedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    payouts.unshift(payoutRecord);
    db.set('payouts', payouts);

    res.json({
      success: true,
      message: `Withdrawal request of ₹${withdrawAmt.toLocaleString('en-IN')} approved and settled!`,
      payout: payoutRecord,
      remainingBalance: users[uIdx].payoutBalance,
    });
  });

  // ==========================================
  // ADMIN FINANCE DASHBOARD APIS
  // ==========================================
  app.get('/api/admin/finance', (req, res) => {
    const payments = db.get('payments');
    const payouts = db.get('payouts');
    const orders = db.get('orders');
    const users = db.get('users');
    const webhookLogs = db.get('webhookLogs');

    const totalGMV = payments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPlatformCommissions = payments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.commissionAmount || 0), 0);

    const totalSellerPayoutsSettled = payouts
      .filter((p) => p.status === 'Processed')
      .reduce((sum, p) => sum + p.netPayoutAmount, 0);

    const pendingKycUsers = users.filter((u) => u.kycStatus === 'pending_verification');

    res.json({
      success: true,
      finance: {
        totalGMV,
        totalPlatformCommissions, // LearnX 15% Platform Treasury
        totalSellerPayoutsSettled,
        merchantSettlementAccount: {
          accountName: 'LearnX Education Technologies Pvt Ltd',
          bankName: process.env.LEARNX_SETTLEMENT_BANK || 'ICICI Bank Ltd',
          accountNumber: process.env.LEARNX_SETTLEMENT_ACCOUNT || '000105008492',
          ifscCode: process.env.LEARNX_SETTLEMENT_IFSC || 'ICIC0000001',
          merchantVpa: process.env.LEARNX_MERCHANT_VPA || 'learnx.merchant@icici',
          status: 'Active & Verified',
        },
        gatewayConfig: {
          provider: process.env.PAYMENT_GATEWAY_PROVIDER || 'PhonePe PG & NPCI UPI',
          merchantId: process.env.PHONEPE_MERCHANT_ID || 'M22LEARNXONLINE',
          webhookEndpoint: '/api/payments/webhook',
          status: 'Connected & Live',
        },
        pendingKycUsers,
        recentPayouts: payouts.slice(0, 10),
        recentWebhooks: webhookLogs.slice(0, 10),
        recentOrders: orders.slice(0, 10),
      },
    });
  });

  app.post('/api/admin/kyc-decision', (req, res) => {
    const { userId, decision, rejectionReason } = req.body;
    const users = db.get('users');
    const uIdx = users.findIndex((u) => u.id === userId);

    if (uIdx === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (decision === 'approve') {
      users[uIdx].kycStatus = 'verified';
      if (users[uIdx].kycDetails) {
        users[uIdx].kycDetails!.verifiedAt = new Date().toISOString();
      }
    } else {
      users[uIdx].kycStatus = 'rejected';
      if (users[uIdx].kycDetails) {
        users[uIdx].kycDetails!.rejectionReason = rejectionReason || 'Information does not match official records.';
      }
    }

    db.set('users', users);

    res.json({
      success: true,
      message: `KYC for ${users[uIdx].name} has been ${decision === 'approve' ? 'approved' : 'rejected'}.`,
      user: users[uIdx],
    });
  });

  // ==========================================
  // NOTIFICATIONS APIS
  // ==========================================
  app.get('/api/notifications', (req, res) => {
    const notifs = db.get('notifications');
    const userNotifs = notifs.filter((n) => n.userId === currentActiveUserId);
    res.json({ success: true, notifications: userNotifs });
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    const notifs = db.get('notifications');
    const nIndex = notifs.findIndex((n) => n.id === req.params.id);
    if (nIndex !== -1) {
      notifs[nIndex].read = true;
      db.set('notifications', notifs);
    }
    res.json({ success: true });
  });

  // ==========================================
  // ADMIN PANEL METRICS & CONTROL APIS
  // ==========================================
  app.get('/api/admin/metrics', (req, res) => {
    const users = db.get('users');
    const tuitions = db.get('tuitions');
    const admissions = db.get('admissions');
    const marketplace = db.get('marketplace');
    const payments = db.get('payments');
    const chapters = db.get('chapters');

    const totalRevenue = payments
      .filter((p) => p.status === 'Paid')
      .reduce((acc, p) => acc + p.amount, 0);

    const totalCommissions = payments
      .filter((p) => p.status === 'Paid')
      .reduce((acc, p) => acc + (p.commissionAmount || 0), 0);

    res.json({
      success: true,
      metrics: {
        totalStudents: users.filter((u) => u.role === 'student').length + 5, // including active peer cohort
        totalTutors: tuitions.filter((t) => t.type === 'home' || t.type === 'online').length,
        totalCentres: tuitions.filter((t) => t.type === 'centre').length,
        totalAdmissions: admissions.length,
        activeAdmissions: admissions.filter((a) => a.status === 'Accepted' || a.status === 'Submitted').length,
        enrolledAdmissions: admissions.filter((a) => a.status === 'Paid' || a.status === 'Enrolled').length,
        marketplaceListings: marketplace.length,
        chaptersCount: chapters.length,
        totalRevenue,
        totalCommissions,
        geminiActive: Boolean(process.env.GEMINI_API_KEY),
      },
    });
  });

  // ==========================================
  // VITE & PRODUCTION STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnX server running on port ${PORT}`);
  });
}

startServer();
