// src/popup/components/LoadingSpinner.tsx
import React from 'react'
import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      width: '100%'
    }}>
      <Loader2 size={24} color="#2563eb" style={{
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{
        marginLeft: '8px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        Loading...
      </span>
    </div>
  )
}