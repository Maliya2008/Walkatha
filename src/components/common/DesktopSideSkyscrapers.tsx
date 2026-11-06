import React from 'react';

export const DesktopSideSkyscrapers: React.FC = () => {
  return (
    <aside aria-hidden="true" className="hidden 2xl:block pointer-events-none select-none">
      {/* Left side ambient rail */}
      <div className="fixed left-4 top-24 bottom-24 w-12 rounded-2xl bg-gradient-to-b from-rose-500/5 via-slate-800/10 to-transparent border border-slate-800/20" />
      {/* Right side ambient rail */}
      <div className="fixed right-4 top-24 bottom-24 w-12 rounded-2xl bg-gradient-to-b from-amber-500/5 via-slate-800/10 to-transparent border border-slate-800/20" />
    </aside>
  );
};
