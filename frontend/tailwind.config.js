/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                tea: {
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
                earth: {
                    50: '#EFEBE9',
                    100: '#D7CCC8',
                    200: '#BCAAA4',
                    300: '#A1887F',
                    400: '#8D6E63',
                    500: '#795548',
                    600: '#6D4C41',
                    700: '#5D4037',
                    800: '#4E342E',
                    900: '#3E2723',
                },
                accent: {
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
                cream: {
                    DEFAULT: '#FFF8F0',
                    paper: '#FFFEFC'
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['Inter', 'sans-serif'],
            }
        }
    },
    plugins: [],
}
