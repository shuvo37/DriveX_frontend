import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
//import './index.css'
import App from './App.jsx'

const API_BASE_URL = 'http://localhost:8080'

// Runs before EVERY axios request in the app and adds the login token
// to the Authorization header, but only for calls to our own backend.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const url = config.url ?? ''
  const baseURL = config.baseURL ?? ''
  const isOurApi = url.startsWith(API_BASE_URL) || baseURL.startsWith(API_BASE_URL)

  // Do not overwrite a header a page already set (CompleteProfile.jsx sets its own)
  if (token && isOurApi && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
