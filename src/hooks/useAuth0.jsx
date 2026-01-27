import { useState, useEffect } from 'react'
import { createAuth0Client } from '@auth0/auth0-spa-js'

const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',
  cacheLocation: 'localStorage',  // ← 追加：state を localStorage に保存（メモリではなく）
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: 'openid profile email',  // シンプルな scope
    prompt: 'login'  // 毎回ログイン画面を表示
    // audience は設定しない（ユーザーログインの場合は不要）
  }
}

export function useAuth0() {
  const [auth0Client, setAuth0Client] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [initCompleted, setInitCompleted] = useState(false)  // 初期化完了フラグ

  useEffect(() => {
    // 初期化が未完了の場合のみ実行
    if (!initCompleted) {
      initAuth()
    }
  }, [initCompleted])  // initCompleted に依存させて、1回のみ実行

  const initAuth = async () => {
    try {
      console.log('[Auth0] ========== 初期化開始 ==========')
      console.log('[Auth0] URL:', window.location.origin)
      console.log('[Auth0] Domain:', import.meta.env.VITE_AUTH0_DOMAIN)
      console.log('[Auth0] ClientID:', import.meta.env.VITE_AUTH0_CLIENT_ID?.substring(0, 10) + '...')
      
      // 環境変数チェック
      if (!import.meta.env.VITE_AUTH0_DOMAIN) {
        console.error('[Auth0] ❌ VITE_AUTH0_DOMAIN が設定されていません')
        console.log('[Auth0] .env.local ファイルを確認してください')
      }
      if (!import.meta.env.VITE_AUTH0_CLIENT_ID) {
        console.error('[Auth0] ❌ VITE_AUTH0_CLIENT_ID が設定されていません')
        console.log('[Auth0] .env.local ファイルを確認してください')
      }
      
      const client = await createAuth0Client(auth0Config)
      setAuth0Client(client)
      console.log('[Auth0] ✓ クライアント作成成功')

      // コールバック処理
      const isCallbackUrl = window.location.search.includes('code=') && 
                           window.location.search.includes('state=')
      console.log('[Auth0] コールバックURL:', isCallbackUrl)
      console.log('[Auth0] 現在のURL:', window.location.href)
      
      if (isCallbackUrl) {
        try {
          console.log('[Auth0] コールバック処理開始...')
          console.log('[Auth0] localStorage state キー確認:')
          Object.keys(localStorage).forEach(key => {
            if (key.includes('state') || key.includes('auth')) {
              console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 30)}...`)
            }
          })
          
          await client.handleRedirectCallback()
          console.log('[Auth0] ✓ コールバック処理完了')
        } catch (error) {
          console.error('[Auth0] ❌ コールバック処理エラー詳細:')
          console.error('[Auth0] エラー名:', error.name)
          console.error('[Auth0] エラーメッセージ:', error.message)
          console.error('[Auth0] エラーコード:', error.error)
          console.error('[Auth0] エラー説明:', error.error_description)
          console.error('[Auth0] 完全なエラー:', error)
          
          // State エラーが出ても、ユーザーはすでに Auth0 側で認証している可能性がある
          // localStorage をクリアして、その後の認証状態確認に進む
          if (error.error === 'invalid_grant' || 
              error.message?.includes('Invalid state') ||
              error.error === 'login_required' ||
              error.error === 'missing_transaction') {
            console.log('[Auth0] ⚠️  State の検証に失敗しましたが、Auth0 上では認証済みの可能性があります')
            console.log('[Auth0] localStorage をクリアして、認証状態を再確認します...')
            
            // localStorage の Auth0 関連キーをクリア
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
              if (key.includes('auth') || key.includes('state')) {
                console.log(`[Auth0]   削除: ${key}`)
                localStorage.removeItem(key)
              }
            })
            
            // URL をクリーンアップ（code= と state= パラメータを削除）
            window.history.replaceState({}, document.title, window.location.pathname)
            console.log('[Auth0] URL をクリーンアップしました')
            
            // エラーは記録するが、ここで return しない
            // 下記の認証状態確認に進む
          } else {
            // その他の予期しないエラー
            console.log('[Auth0] ⚠️  予期しないエラーですが、認証状態を確認します...')
          }
        }
        
        // コールバック処理が成功した場合も URL をクリーンアップ
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      
      // 【重要】コールバック失敗後でも、ここで認証状態を確認する

      // 認証状態の確認
      console.log('[Auth0] 認証状態確認中...')
      const authenticated = await client.isAuthenticated()
      console.log('[Auth0] 認証状態:', authenticated ? '✓ ログイン中' : '✗ 未ログイン')
      setIsAuthenticated(authenticated)

      if (authenticated) {
        try {
          console.log('[Auth0] ユーザー情報取得中...')
          const userData = await client.getUser()
          console.log('[Auth0] ✓ ユーザーログイン済み:', userData.email)
          console.log('[Auth0] ユーザー情報:', {
            sub: userData.sub,
            email: userData.email,
            name: userData.name,
            email_verified: userData.email_verified
          })
          setUser(userData)
        } catch (userError) {
          console.error('[Auth0] ❌ ユーザー情報取得失敗:', userError.message)
        }
      } else {
        console.log('[Auth0] ℹ️  ユーザー未ログイン - ログイン画面を表示します')
        console.log('[Auth0] ℹ️  ログインボタンをクリックしてください')
      }

      console.log('[Auth0] ========== 初期化完了 ==========')
      setIsLoading(false)
      setInitCompleted(true)  // 初期化完了フラグをセット
    } catch (error) {
      console.error('[Auth0] ❌ 初期化エラー:', error.message)
      console.error('[Auth0] エラー詳細:', error)
      console.error('[Auth0] スタック:', error.stack)
      setIsLoading(false)
      setInitCompleted(true)  // エラーでも完了扱い
    }
  }

  const login = async () => {
    try {
      console.log('[Auth0] ログイン開始...')
      if (!auth0Client) {
        console.error('[Auth0] auth0Client が初期化されていません')
        return
      }
      console.log('[Auth0] loginWithRedirect 実行...')
      await auth0Client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          prompt: 'login'  // 毎回ログイン画面を表示（同意画面をスキップ）
        }
      })
      console.log('[Auth0] ログインリダイレクト実行')
    } catch (error) {
      console.error('[Auth0] ❌ ログインエラー:', error)
      console.error('[Auth0] エラーメッセージ:', error.message)
    }
  }

  const logout = async () => {
    try {
      console.log('[Auth0] ログアウト開始...')
      await auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      })
      // ログアウト後、状態をリセット
      setIsAuthenticated(false)
      setUser(null)
      setInitCompleted(false)  // 再度初期化を実行できるようにリセット
      console.log('[Auth0] ✓ ログアウト完了')
    } catch (error) {
      console.error('[Auth0] ❌ ログアウトエラー:', error)
    }
  }

  const getToken = async () => {
    try {
      if (!auth0Client) {
        console.error('[Auth0] ❌ auth0Client が初期化されていません')
        return null
      }
      
      console.log('[Auth0] アクセストークン取得中...')
      
      // Access Token を取得（IDトークンではなく）
      const token = await auth0Client.getTokenSilently({
        scope: 'openid profile email',
        // audience は設定しない（バックエンドで検証を無効化している）
      })
      
      console.log('[Auth0] ✓ アクセストークン取得:', token ? '成功（長さ: ' + token.length + ')' : '失敗')
      return token
    } catch (error) {
      console.error('[Auth0] ❌ トークン取得エラー詳細:')
      console.error('[Auth0] エラー名:', error.name)
      console.error('[Auth0] エラーメッセージ:', error.message)
      console.error('[Auth0] エラーコード:', error.error)
      console.error('[Auth0] 完全なエラー:', error)
      
      // トークン取得に失敗した場合
      if (error.error === 'login_required' || error.error === 'consent_required') {
        console.log('[Auth0] ℹ️  再度ログインが必要です')
      }
      
      return null
    }
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    getToken
  }
}
