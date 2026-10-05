import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { createProvider } from './providers';
import './styles.css';
const root=document.getElementById('root')!;
try {
  const provider=createProvider(import.meta.env.VITE_DATA_PROVIDER ?? 'http');
  const tree=<StrictMode><BrowserRouter><App provider={provider}/></BrowserRouter></StrictMode>;
  if(root.hasChildNodes())hydrateRoot(root,tree);else createRoot(root).render(tree);
} catch {
  root.innerHTML='<main class="empty-page"><h1>Configurazione dati non disponibile</h1><p>Il provider richiesto non è configurato. Riprova dopo aver verificato la configurazione.</p></main>';
}
