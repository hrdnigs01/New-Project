import React from 'react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Building2,
  ShoppingBag,
  Flame,
  Zap,
  Award,
  ChevronRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Brain,
  ShieldAlert,
  CreditCard,
  Briefcase,
  Atom,
  Dna,
  Calculator,
  FileText,
} from 'lucide-react';
import { User, Subject, Chapter, PlannerTask, LeaderboardUser, SubjectMaterialType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeDashboardProps {
  currentUser: User;
  classLevel: number;
  onClassChange?: (level: number) => void;
  stream?: string;
  subjects: Subject[];
  chapters: Chapter[];
  tasks: PlannerTask[];
  leaderboard: LeaderboardUser[];
  onNavigateTab: (tab: string) => void;
  onSelectSubject: (subject: Subject) => void;
  onSelectChapter: (chapter: Chapter) => void;
  onOpenStudyMaterial?: (chapterNumber?: number, subject?: SubjectMaterialType) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  classLevel,
  onClassChange,
  stream,
  subjects,
  chapters,
  tasks,
  leaderboard,
  onNavigateTab,
  onSelectSubject,
  onSelectChapter,
  onOpenStudyMaterial,
}) => {
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const featuredChapter = chapters[0] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Student Progress Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-[#5A634E] text-white p-5 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Class {classLevel} NCERT Study Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Welcome back, {currentUser.name}! 📚
            </h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              You are on a <span className="text-[#FDEBD0] font-bold">{currentUser.streakDays}-day streak</span>.
              Solve your daily NCERT chapter quizzes to level up your rank!
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/15 border border-white/20 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-[#FAD7A0] mb-1">
                <Flame className="w-4 h-4 fill-[#FAD7A0]" />
              </div>
              <div className="text-sm sm:text-base font-bold text-white">{currentUser.streakDays} Days</div>
              <div className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Streak</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/15 border border-white/20 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-[#ABEBC6] mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-sm sm:text-base font-bold text-white">{currentUser.xp}</div>
              <div className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Total XP</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/15 border border-white/20 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-white mb-1">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-sm sm:text-base font-bold text-white">Lv. {currentUser.level}</div>
              <div className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Scholar</div>
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="mt-6 pt-5 border-t border-white/20">
          <div className="flex items-center justify-between text-xs text-white/80 mb-2 font-medium">
            <span>Next Rank: Master Level {currentUser.level + 1}</span>
            <span>{currentUser.xp % 400} / 400 XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${Math.min(100, ((currentUser.xp % 400) / 400) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Quick Access Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#4A4A3A] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#5A634E]" />
            <span>Quick Access</span>
          </h2>
          <span className="text-xs text-[#8B8374]">Essential student tools</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          <button
            onClick={() => onOpenStudyMaterial ? onOpenStudyMaterial(undefined, 'business-studies') : onNavigateTab('materials')}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-500/30 hover:border-amber-500/60 hover:shadow-md transition text-left group relative overflow-hidden"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 transition shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-[#4A4A3A] group-hover:text-amber-800 transition">Study Material</h3>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-900 uppercase">4 Subs</span>
            </div>
            <p className="text-[11px] text-[#8B8374] mt-1 leading-snug">Notes, MCQs & Quiz Arena</p>
          </button>

          <button
            onClick={() => onNavigateTab('ai-assistant')}
            className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E0D8] hover:border-[#5A634E]/50 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EDF0E9] text-[#5A634E] flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 transition">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#4A4A3A] group-hover:text-[#5A634E] transition">AI Doubt Solver</h3>
            <p className="text-[11px] text-[#8B8374] mt-1 leading-snug">Instant step-by-step mentor</p>
          </button>

          <button
            onClick={() => onNavigateTab('tuition')}
            className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E0D8] hover:border-[#5A634E]/50 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FDEBD0] text-[#AF601A] flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#4A4A3A] group-hover:text-[#AF601A] transition">Tuition Finder</h3>
            <p className="text-[11px] text-[#8B8374] mt-1 leading-snug">Centres, home & online tutors</p>
          </button>

          <button
            onClick={() => onNavigateTab('marketplace')}
            className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E0D8] hover:border-[#5A634E]/50 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D5F5E3] text-[#1D8348] flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#4A4A3A] group-hover:text-[#1D8348] transition">Used Books Store</h3>
            <p className="text-[11px] text-[#8B8374] mt-1 leading-snug">Buy, sell & stationery</p>
          </button>

          <button
            onClick={() => onNavigateTab('planner')}
            className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E0D8] hover:border-[#5A634E]/50 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EAF2F8] text-[#2874A6] flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#4A4A3A] group-hover:text-[#2874A6] transition">Study Planner</h3>
            <p className="text-[11px] text-[#8B8374] mt-1 leading-snug">Daily timetable & reminders</p>
          </button>
        </div>
      </div>

      {/* Continue Learning / Featured NCERT Chapter */}
      {featuredChapter && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-[#F5F2ED] border border-[#E5E0D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#5A634E]">
              Continue Learning
            </span>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#4A4A3A]">
              Ch {featuredChapter.chapterNumber}: {featuredChapter.title}
            </h3>
            <p className="text-xs text-[#7A7468] max-w-xl line-clamp-2">
              {featuredChapter.description}
            </p>
          </div>
          <button
            onClick={() => onSelectChapter(featuredChapter)}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5A634E] hover:bg-[#484F3E] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Open Chapter Notes & Quiz</span>
          </button>
        </div>
      )}

      {/* PWA & Android APK Quick Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Class 11 Multi-Subject Study Material & Quiz Arena Hub */}
      {classLevel === 11 && onOpenStudyMaterial && (
        <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-lg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                  CBSE & Matric 2024-25 Handbook
                </span>
                <span className="text-xs text-amber-200/80">
                  5 Core Subjects • NCERT Mathematics, Science & Commerce
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Class 11 Study Material & Quiz Arena</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Mobile & Android Optimized
                </span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Full 14 NCERT Mathematics chapters, formulas, uploaded material tests, and 300+ board exam MCQs. Tap any subject below to start practicing:
              </p>
            </div>

            <button
              onClick={() => onOpenStudyMaterial(undefined, 'mathematics')}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Math & Quizzes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 5 Subject Cards - Mobile Touch Friendly Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {/* Mathematics */}
            <button
              onClick={() => onOpenStudyMaterial(undefined, 'mathematics')}
              className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400 text-left transition group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 font-bold">
                    14 Ch • MCQs
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  Mathematics
                </h4>
                <p className="text-[11px] text-emerald-100/70 mt-1 line-clamp-2 leading-snug">
                  Sets, Calculus, Trigonometry, Conics, Permutations, Statistics & Probability.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                <span>Open Math Quiz Arena</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            {/* Business Studies */}
            <button
              onClick={() => onOpenStudyMaterial(undefined, 'business-studies')}
              className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-left transition group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold">
                    30 MCQs
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Business Studies
                </h4>
                <p className="text-[11px] text-amber-100/70 mt-1 line-clamp-2 leading-snug">
                  Ch 3, Ch 5 & Ch 6: Public/Private, E-Commerce, Social Responsibilities & HOTS cases.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-semibold text-amber-300">
                <span>Open Notes & Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            {/* Physics */}
            <button
              onClick={() => onOpenStudyMaterial(undefined, 'physics')}
              className="p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-left transition group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <Atom className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-slate-900 font-bold">
                    40 MCQs
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                  Physics
                </h4>
                <p className="text-[11px] text-cyan-100/70 mt-1 line-clamp-2 leading-snug">
                  Ch 1, Ch 2, Ch 3 & Ch 4: Units, Kinematics, Vectors, Numericals & Formula Vault.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-semibold text-cyan-300">
                <span>Open Notes & Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            {/* Biology */}
            <button
              onClick={() => onOpenStudyMaterial(undefined, 'biology')}
              className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-400 text-left transition group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                    <Dna className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-400 text-slate-900 font-bold">
                    30 MCQs
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition">
                  Biology
                </h4>
                <p className="text-[11px] text-rose-100/70 mt-1 line-clamp-2 leading-snug">
                  Ch 1, Ch 2 & Ch 3: The Living World, Biological Classification & Plant Kingdom.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px] font-semibold text-rose-300">
                <span>Open Notes & Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            {/* Accountancy */}
            <button
              onClick={() => onOpenStudyMaterial(undefined, 'accountancy')}
              className="p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400 text-left transition group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-400 text-slate-900 font-bold">
                    180+ Qs
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                  Accountancy
                </h4>
                <p className="text-[11px] text-indigo-100/70 mt-1 line-clamp-2 leading-snug">
                  14 Chapters: Journals, Trial Balance, BRS Pro-formas, Adjustments & HOTS.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] font-semibold text-indigo-300">
                <span>Open Notes & Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Class Subjects Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#4A4A3A] tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5A634E]" />
              <span>Class {classLevel} NCERT Subjects {classLevel >= 11 && stream ? `(${stream})` : ''}</span>
            </h2>
            <p className="text-xs text-[#8B8374]">Select your standard or browse syllabus with chapter notes & test banks</p>
          </div>
          <button
            onClick={() => onNavigateTab('learning')}
            className="text-xs font-semibold text-[#5A634E] hover:underline flex items-center gap-0.5 self-start sm:self-auto"
          >
            <span>Explore All Chapters</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Class Selection Strip */}
        {onClassChange && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-semibold text-[#8B8374] mr-1 flex-shrink-0">Grade:</span>
            {[6, 7, 8, 9, 10, 11, 12].map((lvl) => {
              const isSelected = classLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => onClassChange(lvl)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#5A634E] text-white shadow-2xs'
                      : 'bg-white border border-[#E5E0D8] text-[#7A7468] hover:bg-[#F5F2ED]'
                  }`}
                >
                  Class {lvl}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSelectSubject(sub)}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E0D8] hover:border-[#5A634E]/50 hover:shadow-md cursor-pointer transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl bg-[#EDF0E9] text-[#5A634E] flex items-center justify-center shadow-xs`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#4A4A3A] group-hover:text-[#5A634E] transition">
                    {sub.name}
                  </h4>
                  <p className="text-[11px] text-[#8B8374]">{sub.chaptersCount} Chapters</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A8A296] group-hover:text-[#5A634E] transition" />
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Planner Tasks Preview & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Study Planner Preview */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#4A4A3A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5A634E]" />
              <span>Today's Study Schedule</span>
            </h3>
            <button
              onClick={() => onNavigateTab('planner')}
              className="text-xs text-[#5A634E] hover:underline font-semibold"
            >
              Open Planner →
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-[#8B8374] text-xs">
                🎉 You're all caught up for today! Add new topics in Study Planner.
              </div>
            ) : (
              pendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#5A634E] mt-1.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-[#4A4A3A]">{task.title}</h5>
                      <span className="text-[11px] text-[#7A7468]">
                        {task.subject} • {task.durationMinutes} mins • {task.time}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-[#E9E4DB] text-[#5A634E]">
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Class Leaderboard */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D8] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#4A4A3A] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#AF601A]" />
              <span>Class {classLevel} Leaderboard</span>
            </h3>
            <span className="text-[11px] text-[#8B8374]">Weekly XP</span>
          </div>

          <div className="space-y-2">
            {leaderboard.slice(0, 4).map((user, idx) => (
              <div
                key={user.id}
                className={`p-3 rounded-2xl flex items-center justify-between gap-2 border transition ${
                  user.id === currentUser.id
                    ? 'bg-[#EDF0E9] border-[#5A634E]/30'
                    : 'bg-[#F5F2ED] border-[#E5E0D8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0
                        ? 'bg-[#FDEBD0] text-[#AF601A]'
                        : idx === 1
                        ? 'bg-[#E9E4DB] text-[#4A4A3A]'
                        : idx === 2
                        ? 'bg-[#F5EBE6] text-[#A04000]'
                        : 'bg-white text-[#8B8374]'
                    }`}
                  >
                    {user.rank}
                  </span>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#E5E0D8]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#4A4A3A] truncate max-w-[90px] sm:max-w-[120px]">
                      {user.name} {user.id === currentUser.id && '(You)'}
                    </div>
                    <div className="text-[10px] text-[#8B8374]">🔥 {user.streakDays}d streak</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#5A634E]">{user.xp}</span>
                  <span className="text-[10px] text-[#8B8374] block">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
