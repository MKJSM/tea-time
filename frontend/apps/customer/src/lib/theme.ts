import { useEffect, useState } from 'react';

export type SiteTheme = 'light' | 'dark';

function normalizeTheme(value: string | null): SiteTheme {
  return value === 'dark' ? 'dark' : 'light';
}

export function useSiteTheme() {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return normalizeTheme(localStorage.getItem('mt-theme'));
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mt-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
