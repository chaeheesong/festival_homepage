import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import EndedPage from './EndedPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EndedPage />
  </StrictMode>,
)
