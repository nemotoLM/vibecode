import React, { useEffect, useState } from 'react'
import axios from 'axios'

function ProtectedContent({ getToken }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('[ProtectedContent] マウント')
    fetchProtectedData()
  }, [])

  const fetchProtectedData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = await getToken()
      if (!token) {
        setError('トークンが取得できませんでした。ページをリロードしてください。')
        setLoading(false)
        return
      }

      // /api/protected エンドポイントを呼び出す
      const response = await axios.get('http://localhost:8000/api/protected', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setData(response.data)
      setLoading(false)
    } catch (err) {
      console.error('[ProtectedContent] エラー:', err.message)
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <div>読み込み中...</div>
  if (error) return <div style={{ color: 'red' }}>エラー: {error}</div>

  return (
    <div>
      <h2>保護されたコンテンツ</h2>
      {data && (
        <div>
          <p><strong>メッセージ:</strong> {data.message}</p>
          {data.user && (
            <div>
              <p><strong>ユーザー:</strong> {data.user.email}</p>
              <p><strong>名前:</strong> {data.user.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProtectedContent
