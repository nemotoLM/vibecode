import React from 'react'

function UserProfile({ user, onLogout }) {
  return (
    <div className="card">
      <div className="user-info">
        {user.picture && (
          <img 
            src={user.picture} 
            alt="プロフィール画像" 
            className="avatar"
          />
        )}
        <div className="user-details">
          <h2>{user.name || user.nickname || 'ユーザー'}</h2>
          {user.email && (
            <p className="email">{user.email}</p>
          )}
        </div>
      </div>
      <button onClick={onLogout} className="btn btn-secondary">
        ログアウト
      </button>
    </div>
  )
}

export default UserProfile
