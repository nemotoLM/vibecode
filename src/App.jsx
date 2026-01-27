import React, { useState, useEffect } from 'react'
import { useAuth0 } from './hooks/useAuth0'
import Login from './components/Login'
import UserProfile from './components/UserProfile'
import ProtectedContent from './components/ProtectedContent'

function App() {
  const { isAuthenticated, isLoading, user, login, logout, getToken } = useAuth0()

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>🎨 VibeCode</h1>
        <p className="subtitle">Auth0認証デモ</p>
      </header>

      <main>
        {!isAuthenticated ? (
          <Login onLogin={login} />
        ) : (
          <>
            <UserProfile user={user} onLogout={logout} />
            <ProtectedContent getToken={getToken} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
