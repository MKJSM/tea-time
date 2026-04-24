import React, { useEffect, useState } from 'react';

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('admin-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = saved === 'dark' || (!saved && prefersDark);

        setIsDark(initial);
        if (initial) {
            document.body.classList.add('dark');
        }
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.body.classList.add('dark');
            localStorage.setItem('admin-theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('admin-theme', 'light');
        }
    };

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? '🌙' : '☀️'}
        </button>
    );
}
