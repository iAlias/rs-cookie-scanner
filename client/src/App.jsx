import React, { useState, useCallback } from 'react';
import ScanConfig from './components/ScanConfig.jsx';
import ScanStatus from './components/ScanStatus.jsx';
import ResultsSummary from './components/ResultsSummary.jsx';
import CookieTable from './components/CookieTable.jsx';

export default function App() {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleScan = useCallback(async (url, additionalUrls, waitTime) => {
    setScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, additionalUrls, waitTime }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setScanResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }, []);

  const handleUpdateCookie = useCallback(
    async (name, domain, updates) => {
      if (!scanResult) return;

      try {
        const res = await fetch(`/api/scan/${scanResult.id}/cookie`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, domain, ...updates }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Update failed');
        }

        const updatedCookie = await res.json();

        setScanResult((prev) => ({
          ...prev,
          cookies: prev.cookies.map((c) =>
            c.name === name && c.domain === domain ? { ...c, ...updatedCookie } : c
          ),
        }));
      } catch (err) {
        setError(err.message);
      }
    },
    [scanResult]
  );

  const handleExportJSON = useCallback(() => {
    if (!scanResult) return;

    const exportData = {
      domain: scanResult.domain,
      scanDate: scanResult.scanDate,
      cookies: scanResult.cookies.map((c) => ({
        name: c.name,
        domain: c.domain,
        category: c.category,
        provider: c.provider,
        description: c.description,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite,
        expires: c.expires,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `${scanResult.domain}_cookies_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exported successfully!');
  }, [scanResult, showToast]);

  const handleClearScan = useCallback(() => {
    setScanResult(null);
    setError(null);
    setConfirmClear(false);
    showToast('Scan cleared.');
  }, [showToast]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍪 Cookie Scanner</h1>
        <p>Scan websites for cookies and classify them for GDPR compliance</p>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button
            className="btn btn-secondary"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <ScanConfig onScan={handleScan} scanning={scanning} />

      {scanning && <ScanStatus />}

      {scanResult && (
        <>
          <ResultsSummary scanResult={scanResult} />

          <div className="results-panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <h2>Cookie Details</h2>
              <div className="actions-bar">
                <button className="btn btn-primary" onClick={handleExportJSON}>
                  📥 Export JSON
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => setConfirmClear(true)}
                >
                  🗑 Clear Scan
                </button>
              </div>
            </div>

            <CookieTable
              cookies={scanResult.cookies}
              onUpdateCookie={handleUpdateCookie}
            />
          </div>
        </>
      )}

      {!scanning && !scanResult && !error && (
        <div className="empty-state">
          <div className="icon">🍪</div>
          <p>Enter a domain above to start scanning for cookies</p>
        </div>
      )}

      {confirmClear && (
        <div className="confirm-overlay" onClick={() => setConfirmClear(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Clear Scan Results?</h3>
            <p>This will remove all current scan data. This action cannot be undone.</p>
            <div className="actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleClearScan}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
