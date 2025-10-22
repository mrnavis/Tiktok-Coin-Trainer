import React from 'react'
import { createRoot } from 'react-dom/client'
// OJO: sin extensión para evitar conflictos de resolución
import App from './tikcoin/TikCoinTrainer'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
