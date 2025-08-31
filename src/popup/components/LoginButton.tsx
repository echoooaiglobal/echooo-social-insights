// src/popup/components/LoginButton.tsx
import React from 'react'
import { LogIn } from 'lucide-react'

interface LoginButtonProps {
  onLogin: () => void
  loading?: boolean
}

export function LoginButton({ onLogin, loading = false }: LoginButtonProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
      textAlign: 'center',
      width: '100%'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        backgroundColor: '#dbeafe',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <LogIn size={32} color="#2563eb" />
      </div>
      
      <h2 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '8px',
        margin: 0
      }}>
        Connect to Dashboard3
      </h2>
      
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '24px',
        lineHeight: '1.5',
        margin: '0 0 24px 0'
      }}>
        Please log in to your Echooo dashboard to access your campaigns and profile data.
      </p>
      
      <button
        onClick={onLogin}
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: 'white',
          fontWeight: '500',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '14px'
        }}
        onMouseOver={(e) => {
          if (!loading) {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(-1px)'
            target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)'
          }
        }}
        onMouseOut={(e) => {
          if (!loading) {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(0)'
            target.style.boxShadow = 'none'
          }
        }}
      >
        {loading ? 'Opening...' : 'Login to Dashboard'}
      </button>
    </div>
  )
}