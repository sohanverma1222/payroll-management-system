/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3B82F6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366F1',
          600: '#5b5cf6',
          700: '#4f46e5',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#EF4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'default': '12px',
      }
    },
  },
  plugins: [],
}