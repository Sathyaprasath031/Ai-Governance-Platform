import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Apply saved theme before first paint (no flash of wrong theme).
// Ensure `dark` and `light` classes are mutually exclusive.
const saved = localStorage.getItem('gov_theme');
if (saved === 'light') {
  document.documentElement.classList.add('light');
  document.documentElement.classList.remove('dark');
} else {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
