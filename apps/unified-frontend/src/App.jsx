import React from 'react'
import { AuthProvider } from './auth/AuthContext.jsx'
import AppRouter from './router/index.jsx'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
