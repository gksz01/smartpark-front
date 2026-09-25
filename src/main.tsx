import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TenantProvider, TenantThemeProvider } from './core/app-context'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TenantProvider>
        <TenantThemeProvider>
          <App />
        </TenantThemeProvider>
      </TenantProvider>
    </BrowserRouter>
  </StrictMode>,
)
