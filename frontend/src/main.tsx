import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Provider } from 'react-redux'
import store from './store'
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { UIProvider } from './components/UIContext.tsx';
import { CartProvider } from './components/CartContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <UIProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </UIProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
)
