import React from 'react';

interface StaticPageProps {
  page: 'privacy' | 'terms' | 'about' | 'contact';
  onBack: () => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({ page, onBack }) => {
  const content = {
    privacy: {
      title: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය (Privacy Policy)',
      body: `Walkathawa (වල් කතාව) ඔබගේ පෞද්ගලිකත්වයට සහ දත්ත ආරක්ෂාවට ඉහළින්ම ගරු කරයි.\n\n1. තොරතුරු රැස්කිරීම: අප පරිශීලකයන්ගේ පෞද්ගලික තොරතුරු රැස් නොකරයි. තේමා වර්ණය (Navy / Light) වැනි සැකසුම් ඔබගේ උපාංගය තුළ පමණක් සුරැකේ.\n2. කුකීස්: වෙබ් අඩවියේ වේගය සහ ක්‍රියාකාරීත්වය වැඩිදියුණු කිරීමට පමණක් භාවිත වේ.`,
    },
    terms: {
      title: 'සේවා කොන්දේසි (Terms of Service)',
      body: `Walkathawa වෙබ් අඩවිය භාවිතා කිරීමෙන් ඔබ පහත කොන්දේසි වලට එකඟ වේ:\n\n1. වයස් සීමාව: මෙම වෙබ් අඩවියේ පළවන සිංහල වැල කතා සහ වල් කතා නිර්මාණ වැඩිහිටියන් (18+) සඳහා පමණක් සීමා වේ.\n2. අන්තර්ගත භාවිතය: සියලු කතා හුදෙක් විනෝදාස්වාදය සහ සාහිත්‍ය රසවින්දනය සඳහා පමණක් පළකෙරේ.`,
    },
    about: {
      title: 'අප ගැන (About Walkathawa)',
      body: `Walkathawa (වල් කතාව) යනු ශ්‍රී ලාංකික පාඨකයන් සඳහා වෙන්වූ අන්තර්ජාල සිංහල වැල කතා සහ වල් කතා කියවීමේ ප්‍රමුඛතම වේදිකාවයි.\n\nඅපගේ අරමුණ වන්නේ පාඨකයන්ට පිරිසිදු, වේගවත් සහ අනවශ්‍ය බාධාවන්ගෙන් තොර කියවීමේ අත්දැකීමක් නොමිලේ ලබාදීමයි.`,
    },
    contact: {
      title: 'අප අමතන්න (Contact Us)',
      body: `Walkathawa සම්බන්ධයෙන් ඕනෑම විමසීමක් හෝ යෝජනාවක් සඳහා අප හා සම්බන්ධ වන්න:\n\nEmail: contact@walkathawa.site`,
    },
  }[page];

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
      >
        ← මුල් පිටුවට (Home)
      </button>

      <article className="bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1e2d52] pb-3">
          {content.title}
        </h1>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {content.body}
        </div>
      </article>
    </div>
  );
};
