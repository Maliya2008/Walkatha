import { Category, Story } from '../types/story';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'සියලුම කතා (All Stories)', slug: 'all', storyCount: 8 },
  { id: 'romantic', name: 'ආදර කතා (Romantic Stories)', slug: 'romantic', description: 'සිත් ඇදගන්නා ආදර සහ හැඟීම්බර කෙටිකතා', storyCount: 3 },
  { id: 'adventure', name: 'ත්‍රාසජනක (Adventure & Thriller)', slug: 'adventure', description: 'ගුප්ත සහ කුතුහලය පිරි අභිරහස් කතා', storyCount: 2 },
  { id: 'fiction', name: 'ප්‍රබන්ධ කතා (Fictional Stories)', slug: 'fiction', description: 'නවීන සමාජ හා මනඃකල්පිත ප්‍රබන්ධ කතා', storyCount: 2 },
  { id: 'mystery', name: 'අභිරහස් (Mystery Stories)', slug: 'mystery', description: 'අභිරහස් සහ නොවිසඳුනු සිදුවීම්', storyCount: 1 },
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'සඳ එළියේ රහස (The Secret in Moonlight)',
    slug: 'the-secret-in-moonlight',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'නිස්කලංක රාත්‍රියක හමුවූ අමුතු ආගන්තුකයා සහ ඔහුගේ හදවත සසල කළ අපූරු ආදර කතාව.',
    category: 'romantic',
    categoryName: 'ආදර කතා (Romantic Stories)',
    tags: ['walkatha', 'sinhala stories', 'ආදර කතා', 'sinhala katha', 'walkathawa', 'romantic'],
    author: {
      id: 'author-1',
      name: 'කසුන් විජේසිංහ (Kasun Wijesinghe)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      bio: 'සිංහල කෙටිකතා සහ නවකතා රචකයෙකි.'
    },
    uploadDate: '2026-08-31T09:00:00Z',
    updatedDate: '2026-08-31T09:00:00Z',
    readingTime: 6,
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
    categoryName: 'ත්‍රාසජනක (Adventure & Thriller)',
    tags: ['walkatha', 'walakatha', 'වල් කතා', 'sinhala katha', 'mystery', 'ත්‍රාසජනක'],
    author: {
      id: 'author-2',
      name: 'සනත් බණ්ඩාර (Sanath Bandara)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      bio: 'ගවේෂණාත්මක අභිරහස් කතා ලේඛකයෙකි.'
    },
    uploadDate: '2026-08-30T14:15:00Z',
    updatedDate: '2026-08-30T14:15:00Z',
    readingTime: 8,
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
    categoryName: 'ආදර කතා (Romantic Stories)',
    tags: ['walkatha', 'වල්කතා', 'sinhala short stories', 'love story', 'නවකතා'],
    author: {
      id: 'author-3',
      name: 'චතුරිකා පෙරේරා (Chathurika Perera)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      bio: 'ප්‍රේම කතා සහ නවකතා රචිකාවියකි.'
    },
    uploadDate: '2026-08-29T11:00:00Z',
    updatedDate: '2026-08-29T11:00:00Z',
    readingTime: 5,
    views: 4590,
    featured: true,
    published: true,
    metaTitle: 'නොනිමි ආදරය (Endless Love) - Sinhala Romantic Katha',
    metaDescription: 'කියවන්න නොනිමි ආදරය, ආදරයේ ගැඹුර විඳින්න Walkathawa (වල් කතාව) හරහා.',
    fullContent: `කොළඹ විශ්වවිද්‍යාලයේ සෙවණැලි වැටුණු මාර්ගයේ ඇවිද යද්දී මට නැවතත් ඇයව සිහිපත් විය. සරසවි සමයේදී අපි දෙදෙනා පැය ගණන් කතාබහ කරමින් සිටි ඒ ගස යට අද වෙනත් පරපුරක් සිනාසෙමින් සිටිති.

අප දෙදෙනා වෙන්වී ගොස් වසර දහයක් ගතවී තිබුණි. නමුත් ජීවිතයේ නොසිතූ මොහොතක, වැසි බර හැන්දෑවක කොළඹ පොත් සාප්පුවකදී අප නැවත මුහුණට මුහුණ හමුවිය.

ඇගේ දෑස්වල තවමත් තිබුණේ ඒ අහිංසක සුහදශීලී බවමය. ඇය මා දෙස බලා සිනාසුණාය. ඒ සිනහව වසර දහයක නිහැඬියාව එක මොහොතකින් බිඳ දැමීමට සමත් විය.`
  },
  {
    id: 'story-4',
    title: 'මායාවී නගරය (The Mystic City)',
    slug: 'the-mystic-city',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'අනාගත ලෝකයක තාක්ෂණය සහ සිහින අතර අතරමං වූ මිනිසුන්ගේ අරුම පුදුම ප්‍රබන්ධය.',
    category: 'fiction',
    categoryName: 'ප්‍රබන්ධ කතා (Fictional Stories)',
    tags: ['walkatha', 'walakatha', 'sinhala fictional stories', 'sinhala katha', 'fiction'],
    author: {
      id: 'author-1',
      name: 'කසුන් විජේසිංහ (Kasun Wijesinghe)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      bio: 'සිංහල කෙටිකතා සහ නවකතා රචකයෙකි.'
    },
    uploadDate: '2026-08-28T08:30:00Z',
    updatedDate: '2026-08-28T08:30:00Z',
    readingTime: 7,
    views: 1880,
    featured: false,
    published: true,
    metaTitle: 'මායාවී නගරය - Sinhala Sci-Fi & Fiction Story',
    metaDescription: 'කියවන්න මායාවී නගරය, නවීන විද්‍යා ප්‍රබන්ධ සිංහල කෙටිකතාව Walkathawa වෙතින්.',
    fullContent: `වසර 2085. කොළඹ අහස උසට නැගුණු නියෝන් ආලෝක කුලුනු අතරින් පාවෙන වාහන නිහඬව ගමන් කළේය.

නමුත් ඒ දීප්තිමත් ආලෝකයට යටින් වූ අඳුරු වීදිවල මිනිසුන් සොයමින් සිටියේ අහිමි වූ සැබෑ මිනිස් හැඟීම්ය. කෘත්‍රිම බුද්ධිය විසින් මෙහෙයවනු ලබන ලෝකයක, සිතුවිලි නිදහසේ බෙදාගත හැකි එකම තැන වූයේ 'Walkathawa' රහස් ග්‍රන්ථාලය පමණි.`
  }
];
