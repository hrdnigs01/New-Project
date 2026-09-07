import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  Brain,
  Calendar,
  Building2,
  ShoppingBag,
  CreditCard,
  Shield,
  Search,
  Sparkles,
  Award,
  Store,
  Briefcase,
  UserCheck,
  FileText,
} from 'lucide-react';
import {
  User,
  Subject,
  Chapter,
  PlannerTask,
  TuitionProfile,
  AdmissionRequest,
  MarketplaceItem,
  PaymentTransaction,
  NotificationItem,
  LeaderboardUser,
  UserRole,
  SubjectMaterialType,
} from './types';
import { Header } from './components/Header';
import { SearchModal } from './components/SearchModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AuthModal } from './components/AuthModal';
import { RoleOnboardingModal } from './components/RoleOnboardingModal';
import { HomeDashboard } from './components/HomeDashboard';
import { LearningView } from './components/LearningView';
import { StudyMaterialView } from './components/StudyMaterialView';
import { AiAssistantView } from './components/AiAssistantView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { TuitionFinderView } from './components/TuitionFinderView';
import { MarketplaceView } from './components/MarketplaceView';
import { PaymentsView } from './components/PaymentsView';
import { SellerDashboardView } from './components/SellerDashboardView';
import { ServiceProviderDashboardView } from './components/ServiceProviderDashboardView';
import { AdminPanelView } from './components/AdminPanelView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { safeFetchJson } from './utils/api';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('home');

  // Active User Profile
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_student_1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@learnx.in',
    role: 'student',
    classLevel: 10,
    stream: 'Science',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    xp: 1420,
    streakDays: 7,
    level: 4,
    badges: [],
    lastActiveDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-01-01',
    isRoleSelected: true,
  });

  const [classLevel, setClassLevel] = useState<number>(10);
  const [stream, setStream] = useState<string>('Science');

  // App Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [tuitions, setTuitions] = useState<TuitionProfile[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRequest[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Selection states for cross-view deep linking
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [pendingAdmissionForPayment, setPendingAdmissionForPayment] = useState<AdmissionRequest | null>(null);
  const [pendingMarketplaceItemForPayment, setPendingMarketplaceItemForPayment] = useState<MarketplaceItem | null>(null);
  const [materialInitialChapter, setMaterialInitialChapter] = useState<number | undefined>(undefined);
  const [materialInitialSubject, setMaterialInitialSubject] = useState<SubjectMaterialType | undefined>(undefined);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'account'>('login');
  const [isRoleOnboardingOpen, setIsRoleOnboardingOpen] = useState(false);

  // Initial Data Fetch
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('learnx_token');
    const data = await safeFetchJson<{ success: boolean; user: User }>('/api/auth/current-user', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (data?.success && data.user) {
      setCurrentUser(data.user);
      setClassLevel(data.user.classLevel || 10);
      if (data.user.stream) setStream(data.user.stream);
      if (data.user.isRoleSelected === false) {
        setIsRoleOnboardingOpen(true);
      }
    }
  };

  const fetchCurriculum = async (lvl: number) => {
    const [sRes, cRes] = await Promise.all([
      safeFetchJson<{ success: boolean; subjects: Subject[] }>(`/api/curriculum/subjects?classLevel=${lvl}`),
      safeFetchJson<{ success: boolean; chapters: Chapter[] }>(`/api/curriculum/chapters?classLevel=${lvl}`),
    ]);
    if (sRes?.success && sRes.subjects) setSubjects(sRes.subjects);
    if (cRes?.success && cRes.chapters) setChapters(cRes.chapters);
  };

  const fetchSecondaryData = async () => {
    const token = localStorage.getItem('learnx_token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const [tRes, lRes, tuRes, aRes, mRes, txRes, nRes] = await Promise.all([
      safeFetchJson<{ success: boolean; tasks: PlannerTask[] }>('/api/planner/tasks', { headers: authHeader }),
      safeFetchJson<{ success: boolean; leaderboard: LeaderboardUser[] }>('/api/learning/leaderboard'),
      safeFetchJson<{ success: boolean; tuitions: TuitionProfile[] }>('/api/tuition/all'),
      safeFetchJson<{ success: boolean; admissions: AdmissionRequest[] }>('/api/tuition/admissions/list', { headers: authHeader }),
      safeFetchJson<{ success: boolean; items: MarketplaceItem[] }>('/api/marketplace/items'),
      safeFetchJson<{ success: boolean; payments: PaymentTransaction[] }>('/api/payments/transactions', { headers: authHeader }),
      safeFetchJson<{ success: boolean; notifications: NotificationItem[] }>('/api/notifications', { headers: authHeader }),
    ]);

    if (tRes?.success && tRes.tasks) setTasks(tRes.tasks);
    if (lRes?.success && lRes.leaderboard) setLeaderboard(lRes.leaderboard);
    if (tuRes?.success && tuRes.tuitions) setTuitions(tuRes.tuitions);
    if (aRes?.success && aRes.admissions) setAdmissions(aRes.admissions);
    if (mRes?.success && mRes.items) setMarketplace(mRes.items);
    if (txRes?.success && txRes.payments) setTransactions(txRes.payments);
    if (nRes?.success && nRes.notifications) setNotifications(nRes.notifications);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchSecondaryData();
  }, []);

  const handleClassChange = (lvl: number) => {
    setClassLevel(lvl);
    setSelectedSubject(null);
    setSelectedChapter(null);
  };

  useEffect(() => {
    fetchCurriculum(classLevel);
    setSelectedSubject((prev) => (prev && prev.classLevel === classLevel ? prev : null));
    setSelectedChapter((prev) => (prev && prev.classLevel === classLevel ? prev : null));
  }, [classLevel]);

  // Auth Success Handler
  const handleAuthSuccess = (user: User, token?: string) => {
    if (token) {
      localStorage.setItem('learnx_token', token);
    }
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (user.isRoleSelected === false) {
      setIsRoleOnboardingOpen(true);
    } else {
      if (user.role === 'seller') {
        setActiveTab('seller');
      } else if (user.role === 'service_provider' || user.role === 'tutor' || user.role === 'centre') {
        setActiveTab('service_provider');
      } else if (user.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('home');
      }
    }
    fetchSecondaryData();
  };

  // Role Selected Handler after initial signup onboarding
  const handleRoleSelected = (newRole: UserRole) => {
    setIsRoleOnboardingOpen(false);
    setCurrentUser((prev) => ({ ...prev, role: newRole, isRoleSelected: true }));
    if (newRole === 'seller') setActiveTab('seller');
    else if (newRole === 'service_provider') setActiveTab('service_provider');
    else if (newRole === 'admin') setActiveTab('admin');
    else setActiveTab('home');
    fetchCurrentUser();
    fetchSecondaryData();
  };

  // Role switch handler
  const handleSwitchRole = async (role: UserRole) => {
    try {
      const token = localStorage.getItem('learnx_token');
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.token) {
          localStorage.setItem('learnx_token', data.token);
        }
        if (role === 'admin') {
          setActiveTab('admin');
        } else if (role === 'seller') {
          setActiveTab('seller');
        } else if (role === 'service_provider' || role === 'tutor' || role === 'centre') {
          setActiveTab('service_provider');
        } else {
          setActiveTab('home');
        }
        fetchSecondaryData();
      }
    } catch (err) {
      console.warn('Error switching role:', err);
    }
  };

  // Planner handlers
  const handleAddTask = async (task: Partial<PlannerTask>) => {
    const token = localStorage.getItem('learnx_token');
    const res = await fetch('/api/planner/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(task),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => [...prev, data.task]);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const res = await fetch(`/api/planner/tasks/${taskId}/toggle`, {
      method: 'PATCH',
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/planner/tasks/${taskId}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Marketplace handlers
  const handleAddMarketplace = async (item: Partial<MarketplaceItem>) => {
    const res = await fetch('/api/marketplace/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (data.success) {
      setMarketplace((prev) => [data.item, ...prev]);
    }
  };

  const handleDeleteMarketplace = async (id: string) => {
    await fetch(`/api/marketplace/items/${id}`, { method: 'DELETE' });
    setMarketplace((prev) => prev.filter((i) => i.id !== id));
  };

  const handleMarkNotificationRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleOpenStudyMaterial = (chNum?: number, subject?: SubjectMaterialType) => {
    setMaterialInitialChapter(chNum);
    if (subject) {
      setMaterialInitialSubject(subject);
    }
    setActiveTab('materials');
  };

  // Student Navigation Items
  const studentNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learning', label: 'NCERT', icon: BookOpen },
    { id: 'materials', label: 'Study Material & Quiz', icon: FileText, badge: 'Physics + Math' },
    { id: 'ai-assistant', label: 'AI Doubt', icon: Brain, badge: 'Gemini' },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'tuition', label: 'Tuition', icon: Building2 },
    { id: 'marketplace', label: 'Books', icon: ShoppingBag },
    { id: 'payments', label: 'Pay UPI', icon: CreditCard },
  ];

  // Role checking
  const isSeller = currentUser.role === 'seller';
  const isServiceProvider =
    currentUser.role === 'service_provider' || currentUser.role === 'tutor' || currentUser.role === 'centre';
  const isAdmin = currentUser.role === 'admin';
  const isStudent = !isSeller && !isServiceProvider && !isAdmin;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A4A3A] flex flex-col font-sans selection:bg-[#5A634E]/20 selection:text-[#383C2F]">
      {/* Top App Header */}
      <Header
        currentUser={currentUser}
        classLevel={classLevel}
        onClassChange={handleClassChange}
        stream={stream}
        onStreamChange={(s) => setStream(s)}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'account');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Role-Specific Sub-navigation Headers */}
      {isStudent && (
        <div className="hidden md:block border-b border-[#E5E0D8] bg-[#F5F2ED]/90 sticky top-[57px] z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center gap-1.5">
              {studentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition whitespace-nowrap ${
                      isActive
                        ? 'bg-[#5A634E] text-white shadow-sm'
                        : 'text-[#7A7468] hover:text-[#4A4A3A] hover:bg-[#EBE7DF]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#E9E4DB] text-[#5A634E]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#8B8374]">
              <span>Classes 6–12 • Natural Tones</span>
            </div>
          </div>
        </div>
      )}

      {isSeller && (
        <div className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-[57px] z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FDEBD0] text-[#AF601A] flex items-center justify-center font-bold text-sm">
                🛍️
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-[#4A4A3A]">
                  {currentUser.kycDetails?.businessName || currentUser.name} (Seller Dashboard)
                </span>
                <p className="text-[11px] text-[#7A7468]">
                  LearnX Bookstore & Depot • 15% Platform Commission Model
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('account');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-semibold text-[#4A4A3A] hover:bg-[#F5F2ED] transition shadow-xs"
              >
                Seller Account
              </button>
              <button
                onClick={() => setIsRoleSwitcherOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#5A634E] text-white text-xs font-semibold hover:bg-[#484F3E] transition shadow-xs"
              >
                Switch Role
              </button>
            </div>
          </div>
        </div>
      )}

      {isServiceProvider && (
        <div className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-[57px] z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D5F5E3] text-[#1D8348] flex items-center justify-center font-bold text-sm">
                🧑‍🏫
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-[#4A4A3A]">
                  {currentUser.name} (Service Provider & Tutor Portal)
                </span>
                <p className="text-[11px] text-[#7A7468]">
                  Tutoring, PPT/Design & Project Guidance • 15% One-Time Admission Fee
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('account');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-semibold text-[#4A4A3A] hover:bg-[#F5F2ED] transition shadow-xs"
              >
                Provider Account
              </button>
              <button
                onClick={() => setIsRoleSwitcherOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#5A634E] text-white text-xs font-semibold hover:bg-[#484F3E] transition shadow-xs"
              >
                Switch Role
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-[57px] z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EAECEE] text-[#2C3E50] flex items-center justify-center font-bold text-sm">
                🛡️
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-[#4A4A3A]">
                  LearnX Central Administration & Finance Control
                </span>
                <p className="text-[11px] text-[#7A7468]">
                  15% Treasury Ledger, KYC Approvals, Gateway Settlements & Moderation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRoleSwitcherOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#5A634E] text-white text-xs font-semibold hover:bg-[#484F3E] transition shadow-xs"
              >
                Switch Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5 pb-20 md:pb-10">
        {/* Strict Role Separation: Dedicated Dashboards */}
        {isSeller ? (
          <SellerDashboardView
            currentUser={currentUser}
            onRefreshUser={fetchCurrentUser}
            onOpenStorePreview={() => {
              setActiveTab('marketplace');
            }}
          />
        ) : isServiceProvider ? (
          <ServiceProviderDashboardView
            currentUser={currentUser}
            onRefreshUser={fetchCurrentUser}
          />
        ) : isAdmin ? (
          <AdminPanelView
            currentUser={currentUser}
            onRefreshAll={() => {
              fetchCurrentUser();
              fetchSecondaryData();
            }}
          />
        ) : (
          /* Student Views */
          <>
            {activeTab === 'home' && (
              <HomeDashboard
                currentUser={currentUser}
                classLevel={classLevel}
                onClassChange={handleClassChange}
                stream={stream}
                subjects={subjects}
                chapters={chapters}
                tasks={tasks}
                leaderboard={leaderboard}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectSubject={(sub) => {
                  setSelectedSubject(sub);
                  setActiveTab('learning');
                }}
                onSelectChapter={(ch) => {
                  setSelectedChapter(ch);
                  setActiveTab('learning');
                }}
                onOpenStudyMaterial={handleOpenStudyMaterial}
              />
            )}

            {activeTab === 'learning' && (
              <LearningView
                currentUser={currentUser}
                classLevel={classLevel}
                onClassChange={handleClassChange}
                stream={stream}
                onStreamChange={setStream}
                subjects={subjects}
                chapters={chapters}
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
                selectedChapter={selectedChapter}
                onSelectChapter={setSelectedChapter}
                onRefreshUser={fetchCurrentUser}
                onOpenStudyMaterial={handleOpenStudyMaterial}
              />
            )}

            {activeTab === 'materials' && (
              <StudyMaterialView
                initialChapter={materialInitialChapter}
                initialSubject={materialInitialSubject || 'mathematics'}
                onBackToNCERT={() => setActiveTab('learning')}
                onOpenAiAssistant={(promptText) => {
                  setAiInitialPrompt(promptText);
                  setActiveTab('ai-assistant');
                }}
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AiAssistantView
                currentUser={currentUser}
                classLevel={classLevel}
                initialPrompt={aiInitialPrompt}
                onClearInitialPrompt={() => setAiInitialPrompt('')}
              />
            )}

            {activeTab === 'planner' && (
              <StudyPlannerView
                currentUser={currentUser}
                classLevel={classLevel}
                tasks={tasks}
                subjects={subjects}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onRefreshUser={fetchCurrentUser}
              />
            )}

            {activeTab === 'tuition' && (
              <TuitionFinderView
                currentUser={currentUser}
                classLevel={classLevel}
                tuitions={tuitions}
                admissions={admissions}
                onRefreshAdmissions={fetchSecondaryData}
                onInitiatePayment={(adm) => {
                  setPendingAdmissionForPayment(adm);
                  setActiveTab('payments');
                }}
              />
            )}

            {activeTab === 'marketplace' && (
              <MarketplaceView
                currentUser={currentUser}
                classLevel={classLevel}
                items={marketplace}
                onAddItem={handleAddMarketplace}
                onDeleteItem={handleDeleteMarketplace}
                onBuyItem={(item) => {
                  setPendingMarketplaceItemForPayment(item);
                  setActiveTab('payments');
                }}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsView
                currentUser={currentUser}
                transactions={transactions}
                pendingAdmission={pendingAdmissionForPayment}
                onClearPendingAdmission={() => setPendingAdmissionForPayment(null)}
                pendingMarketplaceItem={pendingMarketplaceItemForPayment}
                onClearPendingMarketplaceItem={() => setPendingMarketplaceItemForPayment(null)}
                onRefreshTransactions={fetchSecondaryData}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar - Only for Students */}
      {isStudent && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5F2ED]/95 backdrop-blur-lg border-t border-[#E5E0D8] px-2 py-2">
          <div className="flex items-center justify-around">
            {studentNavItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition relative ${
                    isActive ? 'text-[#5A634E] font-bold scale-105' : 'text-[#7A7468] hover:text-[#4A4A3A]'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2.5 text-[8px] bg-[#5A634E] text-white px-1 py-0.2 rounded-full font-bold leading-none shadow-xs">
                        {item.badge === '4 Subs' ? '4' : '•'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}

            {/* Pay UPI tab on mobile */}
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                activeTab === 'payments' ? 'text-[#5A634E] font-bold' : 'text-[#7A7468]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Pay UPI</span>
            </button>
          </div>
        </nav>
      )}

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subjects={subjects}
        chapters={chapters}
        tuitions={tuitions}
        marketplace={marketplace}
        onSelectChapter={(ch) => {
          setSelectedChapter(ch);
          setActiveTab('learning');
        }}
        onSelectTuition={(t) => {
          setActiveTab('tuition');
        }}
        onSelectMarketplace={(m) => {
          setActiveTab('marketplace');
        }}
      />

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectRole={handleSwitchRole}
        onOpenAuth={(mode) => {
          setIsRoleSwitcherOpen(false);
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Authentication Modal: Mobile Number + OTP, Google, Email/Password, Password Reset, Account Management */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onRequestRoleChange={handleSwitchRole}
        initialMode={authModalMode}
      />

      {/* Role Selection Onboarding Modal: Immediately shown after first signup */}
      <RoleOnboardingModal
        isOpen={isRoleOnboardingOpen}
        onRoleSelected={handleRoleSelected}
        currentUser={currentUser}
      />

      {/* Network / Offline Connectivity Status */}
      <OfflineIndicator />
    </div>
  );
}

