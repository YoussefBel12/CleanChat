import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './components/Login'
import Register from './components/Register'



createRoot(document.getElementById('root')).render(
    <StrictMode>
          <App /> 
  </StrictMode>,
)

