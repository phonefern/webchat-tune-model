/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",      // Scans all JavaScript/TypeScript files in src folder
    "./src/components/**/*.{js,jsx,ts,tsx}", // Scans all files in the components folder
    "./src/pages/**/*.{js,jsx,ts,tsx}",      // Scans all files in the pages folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
