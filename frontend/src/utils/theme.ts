export type Theme = 'dark' | 'light';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark'; // Dark mode is default
}

export function setTheme(theme: Theme): void {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export function toggleTheme(): Theme {
  const html = document.documentElement;
  const current = (html.getAttribute('data-theme') as Theme) || 'dark';
  const next: Theme = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

