/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        screens: {
            'xs': '480px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        extend: {
            colors: {
                // New Design System Colors
                'tea': {
                    sage: 'hsl(140, 25%, 45%)',
                    forest: 'hsl(145, 40%, 25%)',
                    mint: 'hsl(150, 35%, 85%)',
                    // Existing mappings for backward compatibility (approximate)
                    50: '#F1F8E9',
                    100: '#DCEDC8',
                    200: '#C5E1A5',
                    300: '#AED581',
                    400: '#9CCC65',
                    500: '#81C784',
                    600: '#4CAF50',
                    700: '#2E7D32',
                    800: '#1B5E20',
                    900: '#0D3D10',
                },
                'warm-grey': {
                    100: 'hsl(30, 10%, 95%)',
                    300: 'hsl(30, 8%, 70%)',
                    700: 'hsl(30, 5%, 30%)',
                },
                'charcoal': {
                    900: 'hsl(0, 0%, 15%)',
                },
                'amber': {
                    glow: 'hsl(35, 80%, 55%)',
                    // Existing mappings
                    50: '#FFFDE7',
                    100: '#FFF9C4',
                    200: '#FFF59D',
                    300: '#FFF176',
                    400: '#FFEE58',
                    500: '#FFEB3B',
                    600: '#FDD835',
                    700: '#FBC02D',
                    800: '#F9A825',
                    900: '#F57F17',
                },
                'ceramic': {
                    blue: 'hsl(195, 45%, 50%)',
                },
                'cream': {
                    white: 'hsl(40, 25%, 98%)',
                    DEFAULT: '#FFF8F0', // Legacy
                    paper: '#FFFEFC'    // Legacy
                },
                // Accent colors — warm amber, used for highlights, badges, ratings, CTAs
                'accent': {
                    50: 'hsl(35, 80%, 95%)',
                    100: 'hsl(35, 80%, 88%)',
                    200: 'hsl(35, 80%, 78%)',
                    300: 'hsl(35, 80%, 68%)',
                    400: 'hsl(35, 80%, 62%)',
                    500: 'hsl(35, 80%, 55%)',  // == amber.glow
                    600: 'hsl(35, 75%, 48%)',
                    700: 'hsl(35, 70%, 40%)',
                    800: 'hsl(35, 65%, 32%)',
                    900: 'hsl(35, 60%, 20%)',
                },
                // Industry Accents
                'corporate': { blue: 'hsl(210, 75%, 50%)' },
                'retail': { orange: 'hsl(25, 85%, 55%)' },
                'health': { teal: 'hsl(175, 60%, 45%)' },
                'gov': { burgundy: 'hsl(350, 50%, 40%)' },
                'edu': { purple: 'hsl(270, 60%, 55%)' },
                'commercial': { magenta: 'hsl(320, 70%, 50%)' },
                'event': { gold: 'hsl(45, 90%, 55%)' },
                'industrial': { steel: 'hsl(200, 20%, 45%)' },
                'cowork': { lime: 'hsl(80, 70%, 50%)' },
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['"DM Sans"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            boxShadow: {
                'tea-glow': '0 8px 32px hsla(140, 25%, 45%, 0.15)',
                'amber-glow': '0 8px 24px hsla(35, 80%, 55%, 0.20)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            }
        }
    },
    plugins: [],
}
