import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Import Custom Enterprise Style System
import './styles/global.css';
import './styles/dashboard.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/cards.css';
import './styles/responsive.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
