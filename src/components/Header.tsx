import React, { useState } from 'react';
import {
  GraduationCap,
  Flame,
  Zap,
  Bell,
  ChevronDown,
  UserCheck,
  Building2,
  Shield,
  Search,
  Check,
  Sparkles,
  Store,
  Briefcase,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentUser: User;
  classLevel: number;
  onClassChange: (level: number) => void;
  stream?: string;
  onStreamChange: (stream: string) => void;
  onOpenRoleSwitcher: () => void;
  onOpenSearch: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup' | 'account') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  classLevel,
  onClassChange,
  stream,
  onStreamChange,
  onOpenRoleSwitcher,
  onOpenSearch,
  notifications,
  onMarkNotificationRead,
  onOpenAuth,
}) => {
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<string, { label: string; icon: any; color: string }> = {
    student: { label: 'Student', icon: GraduationCap, color: 'bg-[#EDF0E9] text-[#5A634E] border-[#D8DFD2]' },
    seller: { label: 'Seller Store', icon: Store, color: 'bg-[#FDEBD0] text-[#AF601A] border-[#FAD7A0]' },
    service_provider: { label: 'Provider', icon: Briefcase, color: 'bg-[#D5F5E3] text-[#1D8348] border-[#ABEBC6]' },
    tutor: { label: 'Provider', icon: Briefcase, color: 'bg-[#D5F5E3] text-[#1D8348] border-[#ABEBC6]' },
    centre: { label: 'Provider', icon: Briefcase, color: 'bg-[#D5F5E3] text-[#1D8348] border-[#ABEBC6]' },
    admin: { label: 'Admin Panel', icon: Shield, color: 'bg-[#F9EBEA] text-[#922B21] border-[#F5B7B1]' },
  };

  const currentRole = roleLabels[currentUser.role] || roleLabels.student;
  const RoleIcon = currentRole.icon;

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5E0D8]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Class Picker */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#5A634E] flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-xl sm:text-2xl text-[#5A634E] tracking-tight">
                  LearnX
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#F5F2ED] text-[#7A7468] border border-[#E5E0D8]">
                  NCERT 6–12
                </span>
              </div>
            </div>
          </div>

          {/* Class Dropdown Switcher */}
          <div className="relative">
            <button
              id="class-selector-btn"
              onClick={() => setShowClassDropdown(!showClassDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F2ED] hover:bg-[#EBE7DF] border border-[#E5E0D8] text-xs sm:text-sm font-semibold text-[#4A4A3A] transition"
            >
              <span>Class {classLevel}</span>
              {classLevel >= 11 && stream && (
                <span className="hidden md:inline text-[11px] text-[#5A634E] font-medium">
                  ({stream})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8374]" />
            </button>

            {showClassDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 p-3 rounded-2xl bg-white border border-[#E5E0D8] shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="text-[11px] font-semibold text-[#8B8374] uppercase tracking-wider px-1 py-1">
                  Select Grade / Class
                </div>
                <div className="grid grid-cols-4 gap-1.5 my-1.5">
                  {[6, 7, 8, 9, 10, 11, 12].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        onClassChange(lvl);
                        setShowClassDropdown(false);
                      }}
                      className={`py-1.5 text-xs font-bold rounded-xl transition ${
                        classLevel === lvl
                          ? 'bg-[#5A634E] text-white shadow-sm'
                          : 'bg-[#F5F2ED] text-[#4A4A3A] hover:bg-[#EBE7DF]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {classLevel >= 11 && (
                  <div className="mt-2.5 pt-2 border-t border-[#E5E0D8]">
                    <div className="text-[11px] font-semibold text-[#8B8374] uppercase tracking-wider px-1 py-1">
                      Choose Stream
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {['Science', 'Commerce', 'Arts'].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            onStreamChange(s);
                            setShowClassDropdown(false);
                          }}
                          className={`py-1 text-[11px] font-semibold rounded-lg transition ${
                            stream === s
                              ? 'bg-[#5A634E] text-white'
                              : 'bg-[#F5F2ED] text-[#7A7468] hover:bg-[#EBE7DF]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Search Trigger */}
        <button
          id="global-search-trigger"
          onClick={onOpenSearch}
          className="flex-1 max-w-xs hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F5F2ED] hover:bg-[#EBE7DF] border border-[#E5E0D8] text-xs text-[#8B8374] transition"
        >
          <Search className="w-3.5 h-3.5 text-[#8B8374]" />
          <span className="truncate">Search NCERT, Tutors, Books, AI...</span>
          <kbd className="hidden lg:inline-block ml-auto text-[10px] px-2 py-0.5 rounded bg-[#E9E4DB] text-[#7A7468] font-mono">
            /
          </kbd>
        </button>

        {/* Right Stats & Profile Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Search on mobile */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-full bg-[#F5F2ED] border border-[#E5E0D8] text-[#4A4A3A]"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Streak Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDEBD0] border border-[#FAD7A0] text-[#AF601A] text-xs font-bold"
            title={`${currentUser.streakDays} Day Study Streak`}
          >
            <Flame className="w-3.5 h-3.5 fill-[#AF601A]" />
            <span>{currentUser.streakDays}d Streak</span>
          </div>

          {/* XP Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D5F5E3] border border-[#ABEBC6] text-[#1D8348] text-xs font-bold"
            title={`${currentUser.xp} Experience Points (Level ${currentUser.level})`}
          >
            <Zap className="w-3.5 h-3.5 text-[#1D8348]" />
            <span>{currentUser.xp.toLocaleString()} XP</span>
          </div>

          {/* PWA / Android APK Install Button */}
          <PWAInstallButton />

          {/* Notifications */}
          <div className="relative">
            <button
              id="notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full bg-[#F5F2ED] hover:bg-[#EBE7DF] border border-[#E5E0D8] text-[#4A4A3A] transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-[#5A634E]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#AF601A] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] p-3 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8]">
                  <div className="font-serif font-bold text-sm text-[#4A4A3A] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#5A634E]" />
                    <span>Notifications</span>
                  </div>
                  <span className="text-xs text-[#8B8374]">{unreadCount} new</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 py-2 divide-y divide-[#E5E0D8]/60">
                  {notifications.length === 0 ? (
                    <div className="text-xs text-[#8B8374] text-center py-4">No notifications yet</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`pt-2 cursor-pointer transition ${
                          notif.read ? 'opacity-60' : 'opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold text-[#4A4A3A]">{notif.title}</h4>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5A634E] flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#7A7468] line-clamp-2 mt-0.5">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Pill & Switcher */}
          <button
            id="role-switcher-btn"
            onClick={onOpenRoleSwitcher}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition hover:brightness-95 ${currentRole.color}`}
            title="Switch User Role & Profile"
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentRole.label}</span>
            <span className="sm:hidden">{currentUser.name.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* User Account / Login Button */}
          <button
            id="user-account-btn"
            onClick={() => onOpenAuth && onOpenAuth('account')}
            className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[#F5F2ED] hover:bg-[#EBE7DF] border border-[#E5E0D8] transition"
            title="Account Settings & Security"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-[#E5E0D8]"
            />
            <span className="hidden md:inline text-xs font-semibold text-[#4A4A3A]">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
