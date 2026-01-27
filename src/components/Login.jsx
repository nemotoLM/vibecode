import React from 'react'

function Login({ onLogin }) {
  return (
    <div className="card">
      <h2>ようこそ！</h2>
      <p>ログインして始めましょう</p>
      <button onClick={onLogin} className="btn btn-primary">
        ログイン
      </button>
    </div>
  )
}

export default Login
