import React from 'react';

export default function ResultsSummary({ scanResult }) {
  const { cookies, scanDate, domain } = scanResult;

  const total = cookies.length;
  const firstParty = cookies.filter((c) => c.partyType === 'first').length;
  const thirdParty = cookies.filter((c) => c.partyType === 'third').length;
  const secure = cookies.filter((c) => c.secure).length;
  const httpOnly = cookies.filter((c) => c.httpOnly).length;

  return (
    <div className="metrics">
      <div className="metric-card">
        <div className="metric-value">{total}</div>
        <div className="metric-label">Total Cookies</div>
      </div>
      <div className="metric-card">
        <div className="metric-value" style={{ color: 'var(--first-party)' }}>
          {firstParty}
        </div>
        <div className="metric-label">First Party</div>
      </div>
      <div className="metric-card">
        <div className="metric-value" style={{ color: 'var(--third-party)' }}>
          {thirdParty}
        </div>
        <div className="metric-label">Third Party</div>
      </div>
      <div className="metric-card">
        <div className="metric-value" style={{ color: 'var(--success)' }}>
          {secure}
        </div>
        <div className="metric-label">Secure</div>
      </div>
      <div className="metric-card">
        <div className="metric-value" style={{ color: 'var(--warning)' }}>
          {httpOnly}
        </div>
        <div className="metric-label">HttpOnly</div>
      </div>
      <div className="metric-card">
        <div className="metric-value" style={{ fontSize: '0.875rem' }}>
          {new Date(scanDate).toLocaleString()}
        </div>
        <div className="metric-label">Scanned: {domain}</div>
      </div>
    </div>
  );
}
