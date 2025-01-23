import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {Provider} from 'react-redux';
import { store } from './redux/store';
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId="277415786667-skgt48eba1p8pbhmhaosl42rcd7unjli.apps.googleusercontent.com">
        < App />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
)
