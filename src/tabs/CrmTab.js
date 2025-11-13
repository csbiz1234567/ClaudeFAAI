import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';

const CrmTab = ({
clients,
profile,
selectedClientId,
newClient,
saveClient,
loadClient,
deleteClient,
setFollowUp,
completeFollowUp
}) => {
const getDaysUntilBirthday = (dob) => {
if (!dob) return null;
const dobDate = parseDob(dob);
if (!dobDate) return null;

const today = new Date();
const thisYear = today.getFullYear();
let nextBirthday = new Date(thisYear, dobDate.getMonth(), dobDate.getDate());

if (nextBirthday < today) {
  nextBirthday = new Date(thisYear + 1, dobDate.getMonth(), dobDate.getDate());
}

const diffTime = nextBirthday - today;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
return diffDays;

};

return (
<div style={{ padding: 20 }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
<h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>Client Management</h2>
<button
onClick={newClient}
style={{
padding: '10px 20px',
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
color: '#fff',
border: 'none',
borderRadius: 8,
fontSize: 14,
fontWeight: 600,
cursor: 'pointer',
boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
}}
>
+ New Client
</button>
</div>

  <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
    <button
      onClick={saveClient}
      style={{
        width: '100%',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
      }}
    >
      💾 Save Current Client
    </button>
    {selectedClientId && (
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
        Editing: {profile.name || 'Unnamed Client'}
      </p>
    )}
  </div>
  
  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
    {clients.length === 0 ? (
      <div style={{ background: '#F9FAFB', padding: 48, borderRadius: 12, border: '2px dashed #E5E7EB', textAlign: 'center' }}>
        <p style={{ color: '#6B7280', fontSize: 14 }}>No clients yet. Click "New Client" to get started.</p>
      </div>
    ) : (
      clients.map(client => {
        const daysUntilBday = getDaysUntilBirthday(client.profile.dob);
        const showBdayAlert = daysUntilBday !== null && daysUntilBday <= 30;
        const needsFollowUp = client.followUp.nextDate && 
          new Date(client.followUp.nextDate) <= new Date() && 
          client.followUp.status === 'pending';
        
        return (
          <div 
            key={client.id} 
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: selectedClientId === client.id ? '2px solid #667eea' : '2px solid #E5E7EB',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                  {client.profile.name || 'Unnamed Client'}
                </h3>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                  {client.profile.email} • {client.profile.phone}
                </p>
                {client.profile.dob && (
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                    DOB: {new Date(client.profile.dob).toLocaleDateString()}
                  </p>
                )}
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  Last updated: {new Date(client.lastUpdated).toLocaleDateString()}
                </p>
                
                {showBdayAlert && (
                  <div style={{ marginTop: 12, padding: 10, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #F59E0B', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                      🎂 Birthday in {daysUntilBday} day{daysUntilBday !== 1 ? 's' : ''}!
                    </span>
                  </div>
                )}
                
                {needsFollowUp && (
                  <div style={{ marginTop: 12, padding: 10, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '2px solid #EF4444', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>⏰ Follow-up due!</span>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => loadClient(client)}
                  style={{
                    padding: '8px 16px',
                    background: '#3B82F6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Follow-up Actions:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  onClick={() => setFollowUp(client.id, 3)}
                  style={{
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Zoom Met (+3 days)
                </button>
                <button
                  onClick={() => setFollowUp(client.id, 4)}
                  style={{
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  No Reply (+4 days)
                </button>
                <button
                  onClick={() => setFollowUp(client.id, 7)}
                  style={{
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Still No Reply (+7 days)
                </button>
                {client.followUp.status === 'pending' && (
                  <button
                    onClick={() => completeFollowUp(client.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Followed Up
                  </button>
                )}
              </div>
              {client.followUp.nextDate && (
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  Next follow-up: {new Date(client.followUp.nextDate).toLocaleDateString()} 
                  {client.followUp.status === 'completed' && ' (Completed)'}
                </p>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>

);
};

export default CrmTab;
