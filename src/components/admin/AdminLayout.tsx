import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Tag,
  Megaphone,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../../types/admin';

export type AdminTab = 'dashboard' | 'stories' | 'new-story' | 'categories' | 'settings';

interface AdminLayoutProps {
  user: User;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onViewPublicSite: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onViewPublicSite,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stories', label: 'Stories', icon: BookOpen },
    { id: 'new-story', label: 'Add Story', icon: PlusCircle },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'settings', label: 'Website Settings', icon: Settings },
  ];

  const handleNavClick = (tab: AdminTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070e1e] text-white flex flex-col selection:bg-rose-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#070e1e]/95 backdrop-blur-md border-b border-[#16264c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#111f44] cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight font-serif">
                  Walkathawa
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ADMIN
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'text-blue-200/80 hover:text-white hover:bg-[#111f44]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* View Public Site button */}
            <button
              onClick={onViewPublicSite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1633] hover:bg-[#111f44] text-white text-xs font-semibold border border-[#182a55] transition-colors cursor-pointer"
              title="Open public story reader"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">View Public Site</span>
            </button>

            {/* User details badge */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#16264c] text-xs text-blue-200/80">
              <div className="w-7 h-7 rounded-full bg-[#0b1633] border border-[#182a55] flex items-center justify-center text-white">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate max-w-[120px]">{user.email}</span>
            </div>

            {/* Logout button */}
            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1633] hover:bg-rose-500/20 text-white hover:text-rose-400 border border-[#182a55] hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-semibold"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#16264c] bg-[#070e1e] px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive ? 'bg-rose-600 text-white' : 'text-blue-200/80 hover:bg-[#111f44] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Admin Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-[#16264c] bg-[#050b18] text-blue-200/70 text-[11px] py-6 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Admin Session &bull; Role: {user.role.toUpperCase()}</span>
          </div>
          <div>Vercel & GitHub Production Build &bull; Next-Gen Story Publishing Engine</div>
        </div>
      </footer>
    </div>
  );
};
