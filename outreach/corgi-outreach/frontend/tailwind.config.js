/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        prussian: {
          DEFAULT: '#011936',
          50: '#e6edf5',
          100: '#b3c5db',
          200: '#8aa6c5',
          300: '#5a82ab',
          400: '#3a6699',
          500: '#1a4a80',
          600: '#0d3260',
          700: '#0a2a4a',
          800: '#011936',
          900: '#010f22',
        },
        charcoal: {
          DEFAULT: '#465362',
          light: '#5a6a7a',
          dark: '#364252',
        },
        teal: {
          DEFAULT: '#56A3A6',
          50: '#e8f4f4',
          100: '#c5e5e6',
          200: '#9dd3d5',
          300: '#6bbbbe',
          400: '#56A3A6',
          500: '#3d8285',
          600: '#2d6264',
          700: '#1e4244',
        },
        thistle: {
          DEFAULT: '#BEB2C8',
          light: '#d4cce0',
          dark: '#9a8daa',
        },
        tea: {
          DEFAULT: '#C5EBC3',
          light: '#ddf5dc',
          dark: '#8cc48a',
          darker: '#5a9a58',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
