/**
 * main.tsx
 * Entry point приложения
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { applyTheme } from './config/theme.config';

// Применяем активную тему ДО первого рендера (без мигания цветов).
applyTheme();

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
