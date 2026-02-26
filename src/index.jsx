import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/nunito'
import App from './App'
import './index.css'

// Mount the React application
const root = createRoot( document.getElementById( `root` ) )
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
