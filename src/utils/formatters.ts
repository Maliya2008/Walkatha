export function formatSinhalaTimeAgo(dateInput: string | number | Date | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'මෑතකදී';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'මීට සුළු මොහොතකට පෙර';
  if (diffMin < 60) return `මිනිත්තු ${diffMin} කට පෙර`;
  if (diffHours < 24) return `පැය ${diffHours} කට පෙර`;
  if (diffDays === 1) return 'ඊයේ';
  if (diffDays < 7) return `දින ${diffDays} කට පෙර`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `සති ${weeks} කට පෙර`;
  }
  
  return date.toLocaleDateString('si-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSinhalaDate(dateInput: string | number | Date | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('si-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatViewsCount(views?: number): string | null {
  if (!views || views <= 0) return null;
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${views}`;
}

export function cleanCategoryBadgeName(name: string): string {
  if (!name) return '';
  // Remove English suffixes like (Wife Stories) or (All Stories)
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}
