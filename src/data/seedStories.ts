import { Category, Story } from '../types/story';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'සියලුම කතා (All Stories)', slug: 'all', storyCount: 3 },
  { id: 'romantic', name: 'ආදර කතා (Romantic Stories)', slug: 'romantic', description: 'සිත් ඇදගන්නා ආදර සහ හැඟීම්බර කෙටිකතා', storyCount: 2 },
  { id: 'adventure', name: 'ත්‍රාසජනක (Adventure & Thriller)', slug: 'adventure', description: 'ගුප්ත සහ කුතුහලය පිරි අභිරහස් කතා', storyCount: 1 },
  { id: 'fiction', name: 'ප්‍රබන්ධ කතා (Fictional Stories)', slug: 'fiction', description: 'නවීන සමාජ හා මනඃකල්පිත ප්‍රබන්ධ කතා', storyCount: 0 },
  { id: 'mystery', name: 'අභිරහස් (Mystery Stories)', slug: 'mystery', description: 'අභිරහස් සහ නොවිසඳුනු සිදුවීම්', storyCount: 0 },
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'සඳ එළියේ රහස (The Secret in Moonlight)',
    slug: 'the-secret-in-moonlight',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'නිස්කලංක රාත්‍රියක හමුවූ අමුතු ආගන්තුකයා සහ ඔහුගේ හදවත සසල කළ අපූරු ආදර කතාව.',
    category: 'romantic',
    categoryId: 'romantic',
    categoryName: 'ආදර කතා (Romantic Stories)',
    tags: ['walkatha', 'sinhala stories', 'ආදර කතා', 'sinhala katha', 'walkathawa', 'romantic'],
    uploadDate: '2026-08-31T09:00:00Z',
    updatedDate: '2026-08-31T09:00:00Z',
    views: 2840,
    featured: true,
    published: true,
    metaTitle: 'සඳ එළියේ රහස (The Secret in Moonlight) - Sinhala Story',
    metaDescription: 'කියවන්න සඳ එළියේ රහස, සිත් ඇදගන්නා සිංහල ආදර කෙටිකතාවක්. Walkathawa (වල් කතාව) වෙතින් නවතම සිංහල කතා.',
    fullContent: `රාත්‍රී දහය පසුවී තිබුණි. නුවරඑළියේ සීතල සුළඟ ජනේල වීදුරු අතරින් කාන්දු වෙද්දී තේ කෝප්පයක්ද අතැතිව මම සඳ එළිය දෙස බලා සිටියෙමි.
    
ඈත කඳු මුදුන් මතට වැටුණු රිදී පැහැති සඳ කිරණ මුළු නිම්නයම අමුතුම මායාවකින් වසා දමා තිබුණි. ඒ මොහොතේම ගේට්ටුව අසලින් ඇසුණු අඩි ශබ්දය මගේ සිත කුතුහලයෙන් පුරවා දැමීය.

කවුරුන් හෝ දොරට තට්ටු කළේය. දොර විවර කළ මට දක්නට ලැබුණේ වැස්සෙන් සහ මීදුමෙන් තෙතබරි වූ අලංකාර තරුණියකි. ඇගේ දෑස්වල තිබුණේ වචනයෙන් විස්තර කළ නොහැකි ගැඹුරු කතාවකි.

"මට සමාවෙන්න... මේ මහ රෑ මට නවතින්න තැනක් හොයාගන්න බැරිවුණා," ඇය වෙවුලන හඬින් පැවසුවාය.

ඇය නමින් නිම්නා විය. එදා රාත්‍රියේ උණුසුම් කෝපි කෝප්පයක් වටා ගෙතුණු අපේ කතාබහ, ජීවිතයේ මෙතෙක් මා නොදුටු සුන්දරම ආදරයක ආරම්භය බව මා එදා දැන සිටියේ නැත. ඇය කියා දුන් සෑම වචනයක්ම, ඇගේ සුසුම් පවා මගේ හදවතේ ගැඹුරුම තැනක සදාකාලික මතකයක් බවට පත් විය.`
  },
  {
    id: 'story-2',
    title: 'මීදුම් නිම්නයේ අභිරහස (The Mist Valley Mystery)',
    slug: 'the-mist-valley-mystery',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'පැරණි වලව්වක සැඟවුණු රහසක් සොයා ගිය තරුණයෙකුට මුහුණ දීමට සිදුවූ අද්භූත අත්දැකීම.',
    category: 'adventure',
    categoryId: 'adventure',
    categoryName: 'ත්‍රාසජනක (Adventure & Thriller)',
    tags: ['walkatha', 'walakatha', 'වල් කතා', 'sinhala katha', 'mystery', 'ත්‍රාසජනක'],
    uploadDate: '2026-08-30T14:15:00Z',
    updatedDate: '2026-08-30T14:15:00Z',
    views: 3120,
    featured: true,
    published: true,
    metaTitle: 'මීදුම් නිම්නයේ අභිරහස - Sinhala Thriller Story',
    metaDescription: 'කියවන්න මීදුම් නිම්නයේ අභිරහස, කුතුහලය පිරි සිංහල ත්‍රාසජනක කතාව. Walkathawa ඔස්සේ රසවිඳින්න.',
    fullContent: `මධ්‍යම කඳුකරයේ හුදකලා වූ මාතලේ දිස්ත්‍රික්කයේ පැරණි වලව්ව පිළිබඳව ගම්මුන් අතර තිබුණේ නොයෙකුත් බියකරු කතාන්දරය.

වසර ගණනාවකින් කිසිවෙකු පය නොතැබූ එම වලව්වේ උඩුමහලේ රාත්‍රියට පහනක් දැල්වෙන බව බොහෝ දෙනා කීහ. ගවේෂණයට ලැදි මා සහ මගේ මිතුරා රයන්, සත්‍යය සොයා එහි යාමට තීරණය කළෙමු.

අඳුර වැටෙද්දී අපි වලව්වේ මලකඩ කෑ යකඩ ගේට්ටුවෙන් ඇතුළු වුණෙමු. මකුළු දැල් සහ දූවිල්ලෙන් වැසුණු විශාල සාලයේ බිත්තියේ එල්ලා තිබූ පැරණි කළු-සුදු ඡායාරූපයක සිටි කාන්තාවගේ දෑස් අප දෙසම බලා සිටින බවක් දැනුණි.

හදිසියේම උඩුමහලෙන් ඇසුණු සැහැල්ලු පාද ශබ්දයත් සමඟ අප දෙදෙනාම ගල් ගැසී ගියෙමු. පඩිපෙළ නැග ගිය අප ඉදිරියේ විවර වූයේ සියවස් ගණනක් පැරණි අමුතුම රහස් කාමරයකි...`
  },
  {
    id: 'story-3',
    title: 'නොනිමි ආදරය (Endless Love Chronicles)',
    slug: 'endless-love-chronicles',
    coverImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'විශ්වවිද්‍යාල සමයේ ඇරඹි, වසර ගණනාවක් නිහඬව තිබී නැවත මුණගැසුණු ප්‍රේමයක සංවේදී කතාව.',
    category: 'romantic',
    categoryId: 'romantic',
    categoryName: 'ආදර කතා (Romantic Stories)',
    tags: ['walkatha', 'වල්කතා', 'sinhala short stories', 'love story', 'නවකතා'],
    uploadDate: '2026-08-29T11:00:00Z',
    updatedDate: '2026-08-29T11:00:00Z',
    views: 4590,
    featured: true,
    published: true,
    metaTitle: 'නොනිමි ආදරය (Endless Love) - Sinhala Romantic Katha',
    metaDescription: 'කියවන්න නොනිමි ආදරය, ආදරයේ ගැඹුර විඳින්න Walkathawa (වල් කතාව) හරහා.',
    fullContent: `කොළඹ විශ්වවිද්‍යාලයේ සෙවණැලි වැටුණු මාර්ගයේ ඇවිද යද්දී මට නැවතත් ඇයව සිහිපත් විය. සරසවි සමයේදී අපි දෙදෙනා පැය ගණන් කතාබහ කරමින් සිටි ඒ ගස යට අද වෙනත් පරපුරක් සිනාසෙමින් සිටිති.

හදිසියේම මගේ නම කියා කතා කරන හඬක් ඇසී හැරී බැලූ මම මොහොතකට ගොළු වීමි. ඒ නිසංසලාය... වසර හතකට පසුත් ඇගේ ඒ සුපුරුදු සිනහව එලෙසම තිබුණි.

"ඔයා තාමත් ඉස්සර වගේමයි," ඇය පැවසුවාය. කාලයට හෝ දුරස් වීමට මකා දැමිය නොහැකි වූ ආදරයක් නැවත පණ ලැබුවේ එලෙසිනි.`
  }
];
