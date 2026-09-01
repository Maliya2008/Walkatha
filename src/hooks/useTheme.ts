import { useEffect, useState } from 'react';
import { FontFamily, FontSize, ReadingTheme } from '../types/story';

export function useTheme() {
  const [theme, setTheme] = useState<ReadingTheme>(() => {
    const saved = localStorage.getItem('reader_theme') as ReadingTheme;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'sepia')) {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('reader_font_size') as FontSize) || 'md';
  });
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    return (localStorage.getItem('reader_font_family') as FontFamily) || 'serif';
  });

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('sepia');
    } else if (theme === 'sepia') {
      root.classList.remove('dark');
      root.classList.add('sepia');
    } else {
      root.classList.remove('dark');
      root.classList.remove('sepia');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_font_family', fontFamily);
  }, [fontFamily]);

  return {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
  };
}
