// src/popup/components/LoginButton.tsx
import React, { useState } from 'react'
import { LogIn, RefreshCw } from 'lucide-react'

interface LoginButtonProps {
  onLogin: () => void
  onRefresh?: () => void
  loading?: boolean
  refreshing?: boolean
}

export function LoginButton({ onLogin, onRefresh, loading = false, refreshing = false }: LoginButtonProps) {
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
        Connect to Dashboard
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
      
      {/* Main Login Button */}
      <button
        onClick={onLogin}
        disabled={loading || refreshing}
        style={{
          width: '100%',
          background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: 'white',
          fontWeight: '500',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          cursor: (loading || refreshing) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '14px',
          marginBottom: '12px'
        }}
        onMouseOver={(e) => {
          if (!loading && !refreshing) {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(-1px)'
            target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)'
          }
        }}
        onMouseOut={(e) => {
          if (!loading && !refreshing) {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(0)'
            target.style.boxShadow = 'none'
          }
        }}
      >
        {loading ? 'Opening...' : 'Login to Dashboard'}
      </button>
      
      {/* Refresh Button */}
      {onRefresh && (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>Already logged in?</span>
          </div>
          
          <button
            onClick={onRefresh}
            disabled={loading || refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              background: refreshing ? '#f3f4f6' : 'white',
              color: refreshing ? '#9ca3af' : '#374151',
              fontWeight: '400',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              cursor: (loading || refreshing) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '12px'
            }}
            onMouseOver={(e) => {
              if (!loading && !refreshing) {
                const target = e.target as HTMLButtonElement;
                target.style.borderColor = '#9ca3af'
                target.style.backgroundColor = '#f9fafb'
              }
            }}
            onMouseOut={(e) => {
              if (!loading && !refreshing) {
                const target = e.target as HTMLButtonElement;
                target.style.borderColor = '#d1d5db'
                target.style.backgroundColor = 'white'
              }
            }}
          >
            <RefreshCw 
              size={14} 
              style={{ 
                marginRight: '6px',
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} 
            />
            {refreshing ? 'Checking...' : 'Check for Login'}
          </button>
        </div>
      )}
    </div>
  )
}