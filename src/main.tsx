import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ApplicationPage from './ApplicationPage.tsx'
import { isProgramKey } from './applications.ts'

// "?p=<program>" opens that program's application form; anything else is the main page
const programKey = new URLSearchParams(window.location.search).get('p')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isProgramKey(programKey) ? <ApplicationPage programKey={programKey} /> : <App />}
  </StrictMode>,
)
