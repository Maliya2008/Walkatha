import React from 'react';
import { BookOpen, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-400 py-12 px-4 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 text-sm">Walkathawa (වල් කතාව)</h4>
            <p className="text-xs text-slate-500">ශ්‍රී ලාංකික සිංහල කතා රසිකයන්ගේ ප්‍රමුඛතම කියවීමේ අවකාශය</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            18+ වයස් සීමාවට යටත් සාහිත්‍ය කෘති අඩංගු විය හැක
          </span>
          <span className="text-slate-600">•</span>
          <span>© 2026 Walkathawa. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
