import React from 'react';
import { Sun, Moon, Coffee, Type } from 'lucide-react';
import { FontFamily, FontSize, ReadingTheme } from '../../types/story';

interface ReadingControlsProps {
  theme: ReadingTheme;
  onThemeChange: (theme: ReadingTheme) => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  fontFamily: FontFamily;
  onFontFamilyChange: (family: FontFamily) => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
}) => {
  return (
    <div
      id="reading-customization-bar"
      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 my-4 text-xs"
    >
      {/* Theme Modes: Light, Sepia, Dark */}
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
          Theme:
        </span>
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          aria-label="Light mode"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
            theme === 'light'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('sepia')}
          aria-label="Sepia reading mode"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
            theme === 'sepia'
              ? 'bg-[#f4ecd8] text-[#5b4636] shadow-xs ring-1 ring-[#d8ccb0]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-[#8d6e53]" />
          <span>Sepia</span>
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          aria-label="Dark mode"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
            theme === 'dark'
              ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dark</span>
        </button>
      </div>

      {/* Font Size & Type Controls */}
      <div className="flex items-center gap-3">
        {/* Font Family */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-900/60 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onFontFamilyChange('serif')}
            className={`px-2 py-1 rounded text-xs transition-colors font-serif ${
              fontFamily === 'serif'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Serif
          </button>
          <button
            type="button"
            onClick={() => onFontFamilyChange('sans')}
            className={`px-2 py-1 rounded text-xs transition-colors font-sans ${
              fontFamily === 'sans'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sans
          </button>
        </div>

        {/* Font Size Selectors */}
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Size:
          </span>
          {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onFontSizeChange(size)}
              className={`w-7 h-7 rounded-md flex items-center justify-center font-bold transition-all ${
                fontSize === size
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {size === 'sm' && <span className="text-[10px]">A</span>}
              {size === 'md' && <span className="text-xs">A</span>}
              {size === 'lg' && <span className="text-sm">A</span>}
              {size === 'xl' && <span className="text-base">A</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
