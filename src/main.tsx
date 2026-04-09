import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';
import { normalizeLegacyAppHashUrl } from './lib/navigation';
import './index.css';

normalizeLegacyAppHashUrl();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
