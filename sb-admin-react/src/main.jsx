import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const fontAwesomeStylesheet = document.getElementById('fontawesome-stylesheet')
if (fontAwesomeStylesheet) {
  const enableFontAwesome = () => {
    fontAwesomeStylesheet.media = 'all'
  }

  if (fontAwesomeStylesheet.sheet) {
    enableFontAwesome()
  } else {
    fontAwesomeStylesheet.addEventListener('load', enableFontAwesome, { once: true })
  }
}

createRoot(document.getElementById('root')).render(
  <App />,
)
