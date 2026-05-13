import React from 'react'
import ReactDOM from 'react-dom/client'
import '../styles.css'
import '../styles-proto.css'
import App from './App.jsx'
import { FormConfigProvider } from './lib/FormConfigContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <FormConfigProvider>
    <App />
  </FormConfigProvider>
)
