// src/popup/components/UserProfile.tsx
import React from 'react'
import { User, Building2, LogOut } from 'lucide-react'
import type { UserData } from '../../lib/storage'

interface UserProfileProps {
  userData: UserData
  onLogout: () => void
}

export function UserProfile({ userData, onLogout }: UserProfileProps) {
  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#dbeafe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={20} color="#2563eb" />
          </div>
          
          <div>
            <h3 style={{
              fontWeight: '500',
              color: '#111827',
              fontSize: '14px',
              margin: 0,
              marginBottom: '2px'
            }}>
              {userData.fullName}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <Building2 size={12} style={{ marginRight: '4px' }} />
              {userData.companyName}
            </div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          style={{
            padding: '8px',
            color: '#9ca3af',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Logout"
          onMouseOver={(e) => {
            const target = e.target as HTMLElement;
            target.style.color = '#6b7280'
            target.style.backgroundColor = '#f3f4f6'
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLElement;
            target.style.color = '#9ca3af'
            target.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}