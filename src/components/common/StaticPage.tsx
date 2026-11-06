import React from 'react';
import { ArrowLeft, Shield, FileText, Info, Mail, AlertTriangle } from 'lucide-react';

interface StaticPageProps {
  pageType: 'privacy' | 'terms' | 'dmca' | 'about' | 'contact' | 'disclaimer';
  onNavigateHome: () => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({ pageType, onNavigateHome }) => {
  const content = {
    privacy: {
      title: 'Privacy Policy (පුද්ගලිකත්ව ප්‍රතිපත්තිය)',
      icon: <Shield className="w-5 h-5 text-rose-500" />,
      body: `Walkathawa (වල් කතාව) ඔබගේ පුද්ගලිකත්වයට සහ දත්ත ආරක්ෂාවට ඉහළින්ම ගරු කරයි.

1. තොරතුරු රැස්කිරීම: අප පරිශීලකයන්ගේ පුද්ගලික තොරතුරු (නම, ලිපිනය, දුරකථන අංක) අනිවාර්යයෙන් රැස් නොකරයි. පරිශීලක රුචිකත්වයන් මත පදනම් වූ දත්ත (කියවූ කතා, තේමා වර්ණය, අකුරු ප්‍රමාණය) ඔබගේ උපාංගය තුළ පමණක් (Local Storage) සුරැකේ.
2. කුකීස් සහ වෙබ් බීකන්ස්: වෙබ් අඩවියේ වේගය සහ ක්‍රියාකාරීත්වය වැඩිදියුණු කිරීමට කුකීස් භාවිත විය හැක.
3. තෙවන පාර්ශව සබැඳි: බාහිර වෙබ් අඩවි හෝ දැන්වීම් සබැඳි පිළිබඳ වගකීම අප සතු නොවේ.`,
    },
    terms: {
      title: 'Terms of Service (සේවා කොන්දේසි)',
      icon: <FileText className="w-5 h-5 text-rose-500" />,
      body: `Walkathawa වෙබ් අඩවිය භාවිතා කිරීමෙන් ඔබ පහත කොන්දේසි වලට එකඟ වේ:

1. වයස් සීමාව: මෙම වෙබ් අඩවියේ පළවන සමහර සාහිත්‍ය නිර්මාණ සහ කතා වැඩිහිටියන් (18+) සඳහා පමණක් සීමා වේ. වයස අවුරුදු 18ට අඩු පුද්ගලයින් මෙම වෙබ් අඩවිය පරිශීලනය කිරීමෙන් වැළකී සිටිය යුතුය.
2. ප්‍රකාශන හිමිකම: මෙහි පළවන නිර්මාණවල හිමිකාරිත්වය මුල් කතුවරුන් සතු වන අතර අනවසර පිටපත් කිරීම සපුරා තහනම් වේ.
3. අන්තර්ගත භාවිතය: සියලු කතා හුදෙක් විනෝදාස්වාදය සහ සාහිත්‍ය රසවින්දනය සඳහා පමණක් පළකෙරේ.`,
    },
    dmca: {
      title: 'DMCA Copyright Notice',
      icon: <FileText className="w-5 h-5 text-amber-500" />,
      body: `Walkathawa respects the intellectual property rights of authors and content creators.

If you are a copyright owner or an agent thereof and believe that any content posted on Walkathawa infringes upon your copyright, you may submit a written DMCA notice to us.

Please include:
1. Identification of the copyrighted work claimed to have been infringed.
2. The exact URL or slug where the material is located.
3. Your contact information (name, email address).
4. A statement of good faith belief that the disputed use is not authorized by the copyright owner.

Upon receipt of a valid notice, we will investigate and expeditiously remove or disable access to the infringing material.`,
    },
    about: {
      title: 'About Walkathawa (අප ගැන)',
      icon: <Info className="w-5 h-5 text-rose-500" />,
      body: `Walkathawa (වල් කතාව) යනු ශ්‍රී ලාංකික රසිකයන් සඳහා වෙන්වූ අන්තර්ජාල සිංහල කතා කියවීමේ ප්‍රමුඛතම වේදිකාවයි.

අපගේ අරමුණ වන්නේ පාඨකයන්ට පිරිසිදු, සුවපහසු සහ නවීන තාක්ෂණයෙන් යුත් කියවීමේ අත්දැකීමක් නොමිලේ ලබාදීමයි. විවිධ කාණ්ඩ යටතේ දිනපතා යාවත්කාලීන වන කතා සිය ගණනක් මෙහි අන්තර්ගත වේ.`,
    },
    contact: {
      title: 'Contact Us (අප අමතන්න)',
      icon: <Mail className="w-5 h-5 text-rose-500" />,
      body: `Walkathawa සම්බන්ධයෙන් ඕනෑම විමසීමක්, යෝජනාවක් හෝ සහය සඳහා අපගේ කර්තෘ මණ්ඩලය සම්බන්ධ කරගත හැක.

Email: contact@walkathawa.site
Telegram: @walkathawa_official
ප්‍රතිචාර කාලය: පැය 24-48 අතර වේ.`,
    },
    disclaimer: {
      title: 'Disclaimer (වගකීම් ප්‍රකාශය)',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      body: `1. මෙහි පළවන සියලුම කතා සහ චරිත මනඃකල්පිත හෝ කතුවරුන් විසින් ලබාදුන් නිර්මාණ වේ.
2. සැබෑ ජීවිතයේ පුද්ගලයන් හෝ සිදුවීම් සමග යම් සමානකමක් වේ නම් එය හුදෙක් අහඹු සිදුවීමක් පමණි.
3. වැඩිහිටි පාඨකයන් සඳහා වන නිර්මාණ පිළිබඳ පාඨකයාගේම අභිමතය පරිදි කියවිය යුතුය.`,
    },
  }[pageType];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        මුල් පිටුවට (Home)
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 bg-slate-800 rounded-2xl">{content.icon}</div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{content.title}</h1>
        </div>

        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
          {content.body}
        </div>
      </div>
    </div>
  );
};
