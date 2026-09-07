import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Bell,
  Trash2,
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { PlannerTask, User, Subject } from '../types';
import { playChime } from '../utils/audio';

interface StudyPlannerViewProps {
  currentUser: User;
  classLevel: number;
  tasks: PlannerTask[];
  subjects: Subject[];
  onAddTask: (task: Partial<PlannerTask>) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onRefreshUser: () => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  currentUser,
  classLevel,
  tasks,
  subjects,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onRefreshUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || 'Science');
  const [chapter, setChapter] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  // Pomodoro Focus Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60); // 25 min Pomodoro
  const [timerInitial, setTimerInitial] = useState(25 * 60);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playChime('alarm');
      alert('⏰ Focus Study Session Completed! Take a well-deserved 5-minute break.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddTask({
      subject: selectedSubject,
      chapter: chapter || 'Self Revision',
      title,
      date,
      time,
      durationMinutes,
      priority,
      notes,
    });

    setTitle('');
    setChapter('');
    setNotes('');
    setShowAddModal(false);
    playChime('success');
    onRefreshUser();
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#4A4A3A] tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#5A634E]" />
            <span>Study Planner & Focus Alarms</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8B8374]">
            Schedule chapter targets, set reminder alarms, and maintain your {currentUser.streakDays}-day streak.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-full bg-[#5A634E] hover:bg-[#484F3E] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Goal</span>
        </button>
      </div>

      {/* Stats & Focus Pomodoro Timer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E0D8] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B8374] uppercase tracking-wider">
              Daily Target Completion
            </span>
            <span className="text-xs font-bold text-[#5A634E]">{completionPercentage}%</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#4A4A3A]">
            {completedCount} of {totalCount} Done
          </div>
          <div className="w-full h-2 rounded-full bg-[#E9E4DB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#5A634E] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8B8374]">
            Completing scheduled tasks adds <span className="text-[#AF601A] font-bold">+15 XP</span> each to your leaderboard standing!
          </p>
        </div>

        {/* Pomodoro Focus Timer */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#F5F2ED] border border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EDF0E9] border border-[#D8DFD2] text-[#5A634E] text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Pomodoro Focus Timer</span>
            </div>
            <h3 className="text-base font-serif font-bold text-[#4A4A3A]">Deep Work Study Session</h3>
            <p className="text-xs text-[#7A7468]">
              Stay focused without distractions. Audio alarm sounds on completion.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#5A634E] tracking-wider">
              {formatTimer(timerSecondsLeft)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playChime('click');
                  setIsTimerRunning(!isTimerRunning);
                }}
                className="w-10 h-10 rounded-xl bg-[#5A634E] hover:bg-[#484F3E] text-white flex items-center justify-center transition shadow-sm"
              >
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button
                onClick={() => {
                  playChime('click');
                  setIsTimerRunning(false);
                  setTimerSecondsLeft(25 * 60);
                }}
                className="w-10 h-10 rounded-xl bg-white hover:bg-[#EBE7DF] border border-[#E5E0D8] text-[#4A4A3A] flex items-center justify-center transition"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => playChime('alarm')}
                className="p-2 rounded-xl bg-white hover:bg-[#EBE7DF] border border-[#E5E0D8] text-[#7A7468] hover:text-[#4A4A3A] transition text-xs"
                title="Preview Alarm Chime"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-[#4A4A3A]">Scheduled Tasks & Revision Timetable</h3>
          <span className="text-xs text-[#8B8374]">{tasks.length} total goals</span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-[#E5E0D8] text-center text-[#8B8374] text-xs">
            No study goals scheduled yet. Click "+ Add Study Goal" to plan your day.
          </div>
        ) : (
          tasks.map((task) => {
            const isDone = task.isCompleted;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-3 shadow-xs ${
                  isDone
                    ? 'bg-[#F5F2ED] border-[#E5E0D8] opacity-70'
                    : 'bg-white border-[#E5E0D8] hover:border-[#5A634E]/50'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => {
                      playChime(isDone ? 'click' : 'success');
                      onToggleTask(task.id);
                      onRefreshUser();
                    }}
                    className="mt-0.5 text-[#5A634E] hover:text-[#484F3E] transition"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 fill-[#5A634E] text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#8B8374]" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-serif font-bold leading-tight ${isDone ? 'line-through text-[#8B8374]' : 'text-[#4A4A3A]'}`}>
                        {task.title}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-[#FADBD8] text-[#922B21] border border-[#F5B7B1]'
                            : task.priority === 'medium'
                            ? 'bg-[#FDEBD0] text-[#AF601A] border border-[#FAD7A0]'
                            : 'bg-[#EDF0E9] text-[#5A634E] border border-[#D8DFD2]'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#8B8374]">
                      <span className="text-[#5A634E] font-semibold">{task.subject}</span>
                      <span>•</span>
                      <span>{task.chapter}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.date} at {task.time} ({task.durationMinutes}m)
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-[#7A7468] pt-1 leading-snug">{task.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => playChime('alarm')}
                    className="p-1.5 rounded-xl bg-[#F5F2ED] hover:bg-[#EBE7DF] border border-[#E5E0D8] text-[#5A634E] transition"
                    title="Test Task Alarm"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-xl bg-[#F5F2ED] hover:bg-[#FADBD8] border border-[#E5E0D8] text-[#8B8374] hover:text-[#922B21] transition"
                    title="Remove Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-[32px] shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <h3 className="text-base font-serif font-bold text-[#4A4A3A] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#5A634E]" />
                <span>Add Study Task</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8B8374] hover:text-[#4A4A3A] text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#4A4A3A] font-semibold mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] focus:outline-none focus:border-[#5A634E]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="General Revision">General Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A4A3A] font-semibold mb-1">Topic / Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Practice 15 Light Reflection Ray Diagrams"
                  className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] placeholder-[#8B8374] focus:outline-none focus:border-[#5A634E]"
                />
              </div>

              <div>
                <label className="block text-[#4A4A3A] font-semibold mb-1">Chapter Name (Optional)</label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. Light: Reflection and Refraction"
                  className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] placeholder-[#8B8374] focus:outline-none focus:border-[#5A634E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#4A4A3A] font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] focus:outline-none focus:border-[#5A634E]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A4A3A] font-semibold mb-1">Alarm Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] focus:outline-none focus:border-[#5A634E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#4A4A3A] font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] focus:outline-none focus:border-[#5A634E]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A4A3A] font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] focus:outline-none focus:border-[#5A634E]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Board Exam)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#4A4A3A] font-semibold mb-1">Key Notes / Goal Checklist</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Focus on sign conventions and mirror formula derivations"
                  className="w-full p-2.5 rounded-2xl bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A] placeholder-[#8B8374] focus:outline-none focus:border-[#5A634E]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full bg-[#F5F2ED] text-[#7A7468] font-semibold hover:bg-[#EBE7DF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#5A634E] hover:bg-[#484F3E] text-white font-bold transition shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
