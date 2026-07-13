import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import axios from 'axios';

// Bypass localtunnel warning screen for all API requests
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  config = config || {};
  const headers = new Headers(config.headers || {});
  headers.set('Bypass-Tunnel-Reminder', 'true');
  config.headers = headers;
  return originalFetch(resource, config);
};
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
