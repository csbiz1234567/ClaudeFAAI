import React, { useState, useEffect } from 'react';

const DisclaimerTab = () => {
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    // Check if user has already agreed in this session
    const agreed = sessionStorage.getItem('disclaimer_agreed');
    if (agreed === 'true') {
      setHasAgreed(true);
    }
  }, []);

  useEffect(() => {
    if (hasAgreed) {
      sessionStorage.setItem('disclaimer_agreed', 'true');
    }
  }, [hasAgreed]);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Simple Header */}
      <div style={{
        background: '#ffffff',
        border: '2px solid #1f2937',
        borderRadius: 12,
        padding: 32,
        marginBottom: 32,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h1 style={{ margin: 0, color: '#1f2937', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Before You Begin
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16, lineHeight: 1.6, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          This is a planning tool to help you explore financial scenarios. Please take a moment to understand what it is—and what it isn't.
        </p>
      </div>

      {/* Main Disclaimer Content */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: 12, 
        padding: 32,
        border: '2px solid #e5e7eb',
        marginBottom: 24
      }}>
        
        {/* What This Is */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
            What This Tool Is
          </h2>
          <ul style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginLeft: 20, marginTop: 12 }}>
            <li>An <strong>educational calculator</strong> to explore financial scenarios and understand how different decisions might impact your future</li>
            <li>A <strong>starting point</strong> for conversations with qualified financial advisers</li>
            <li>Based on <strong>simplified assumptions</strong> about CPF rates, investment returns, and life events that may not match reality</li>
          </ul>
        </div>

        {/* What This Isn't */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
            What This Tool Isn't
          </h2>
          <ul style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginLeft: 20, marginTop: 12 }}>
            <li><strong>Not financial advice</strong> — We're not licensed financial advisers, and this doesn't replace professional guidance</li>
            <li><strong>Not a guarantee</strong> — Projections are estimates based on assumptions that may change</li>
            <li><strong>Not a promise of results</strong> — Actual market performance, policy changes, and personal circumstances will differ</li>
          </ul>
        </div>

        {/* Important Points */}
        <div style={{ 
          padding: 24, 
          background: '#f9fafb', 
          borderRadius: 10, 
          border: '2px solid #d1d5db',
          marginBottom: 24
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: 16 }}>
            Please Remember
          </h3>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
            <p style={{ marginTop: 0, marginBottom: 12 }}>
              <strong>Capital is non-guaranteed.</strong> Past performance doesn't guarantee future results. Investments carry risk, and capital may be lost.
            </p>
            <p style={{ marginTop: 0, marginBottom: 12 }}>
              <strong>Consult professionals.</strong> Before making any financial decisions, speak with licensed financial advisers, tax professionals, and legal advisors who can assess your specific situation.
            </p>
            <p style={{ marginTop: 0, marginBottom: 0 }}>
              <strong>You're responsible.</strong> Any decisions you make based on this tool are your own. We're not liable for any outcomes, losses, or damages.
            </p>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div style={{ 
          padding: 24, 
          background: '#ffffff', 
          borderRadius: 10, 
          border: '2px solid #1f2937',
        }}>
          <label style={{ display: 'flex', gap: 16, cursor: 'pointer', alignItems: 'start' }}>
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              style={{ width: 24, height: 24, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                I understand and agree
              </div>
              <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
                I acknowledge this is an educational tool, not financial advice. I'll consult licensed professionals before making financial decisions. 
                I understand capital is non-guaranteed and I'm responsible for verifying information and any decisions I make. 
                The developers have no liability for outcomes or losses.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Status Message */}
      {hasAgreed ? (
        <div style={{ 
          padding: 24, 
          background: '#ffffff', 
          borderRadius: 12, 
          border: '2px solid #1f2937',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ margin: 0, fontSize: 18, color: '#1f2937', fontWeight: 600, marginBottom: 8 }}>
            Ready to start
          </p>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>
            Head to the <strong>Profile</strong> tab to begin your financial planning
          </p>
        </div>
      ) : (
        <div style={{ 
          padding: 24, 
          background: '#ffffff', 
          borderRadius: 12, 
          border: '2px solid #d1d5db',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <p style={{ margin: 0, fontSize: 16, color: '#4b5563' }}>
            Please read and check the box above to continue
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: 24,
        padding: 16, 
        textAlign: 'center',
        fontSize: 13,
        color: '#9ca3af'
      }}>
        <p style={{ margin: 0 }}>
          Last Updated: November 13, 2025 | Singapore Financial Advisory App v1.0
        </p>
      </div>
    </div>
  );
};

export default DisclaimerTab;
