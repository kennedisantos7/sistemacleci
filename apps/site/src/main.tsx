import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {captureRefFromUrl} from './lib/attribution';

// Captura a atribuição de afiliado (?ref=) e grava o cookie first-party.
captureRefFromUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
