import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Apply saved theme before first paint (no flash of wrong theme).
// `dark` class drives Tailwind dark: variants; `light` class drives CSS vars.
const saved = localStorage.getItem('gov_theme');
if (saved === 'light') {
  document.documentElement.classList.add('light');
} else {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
