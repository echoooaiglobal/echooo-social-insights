// src/popup/components/CampaignSelector.tsx
import React, { useState, useEffect } from 'react'
import { ChevronDown, Folder, Calendar } from 'lucide-react'
import { getCampaigns } from '../../lib/storage'
import type { Campaign } from '../../lib/storage'

export function CampaignSelector() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const campaignData = await getCampaigns()
      setCampaigns(campaignData)
      
      if (campaignData.length > 0) {
        setSelectedCampaign(campaignData[0].id)
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign)

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <div style={{
            height: '16px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            width: '25%',
            marginBottom: '8px'
          }}></div>
          <div style={{
            height: '32px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px'
          }}></div>
        </div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center'
      }}>
        <Folder size={32} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          No campaigns found
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
      }}>
        Select Campaign
      </label>
      
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '12px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
          onMouseOver={(e) => (e.target as HTMLElement).style.borderColor = '#9ca3af'}
          onMouseOut={(e) => (e.target as HTMLElement).style.borderColor = '#d1d5db'}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <Folder size={16} color="#9ca3af" style={{ marginRight: '8px' }} />
            <span style={{
              fontSize: '14px',
              color: '#111827',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {selectedCampaignData?.name || 'Select a campaign'}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            color="#9ca3af" 
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            zIndex: 10,
            width: '100%',
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxHeight: '192px',
            overflowY: 'auto'
          }}>
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => {
                  setSelectedCampaign(campaign.id)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  border: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
              >
                <Folder size={16} color="#9ca3af" style={{ marginRight: '8px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {campaign.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '2px'
                  }}>
                    <Calendar size={12} style={{ marginRight: '4px' }} />
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCampaignData && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <strong>Status:</strong> {selectedCampaignData.status}
        </div>
      )}
    </div>
  )
}