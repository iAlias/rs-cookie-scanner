import React, { useState } from 'react';

const URL_REGEX = /^https?:\/\/.+/i;

export default function ScanConfig({ onScan, scanning }) {
  const [url, setUrl] = useState('');
  const [additionalUrls, setAdditionalUrls] = useState('');
  const [waitTime, setWaitTime] = useState(3000);
  const [urlError, setUrlError] = useState('');

  const additionalCount = additionalUrls
    .split('\n')
    .filter((l) => l.trim()).length;

  const validateUrl = (value) => {
    if (!value.trim()) {
      setUrlError('URL is required');
      return false;
    }
    if (!URL_REGEX.test(value.trim())) {
      setUrlError('Invalid URL. Include scheme (https://)');
      return false;
    }
    try {
      new URL(value.trim());
      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateUrl(url)) return;

    // Validate additional URLs
    const lines = additionalUrls
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 10) {
      setUrlError('Maximum 10 additional URLs allowed');
      return;
    }

    for (const line of lines) {
      if (!URL_REGEX.test(line)) {
        setUrlError(`Invalid additional URL: ${line}`);
        return;
      }
    }

    onScan(url.trim(), additionalUrls, waitTime);
  };

  const isValid = url.trim() && URL_REGEX.test(url.trim()) && !scanning;

  return (
    <div className="scan-config">
      <h2>Scan Configuration</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="main-url">Domain / URL *</label>
          <input
            id="main-url"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) validateUrl(e.target.value);
            }}
            onBlur={() => url && validateUrl(url)}
            className={urlError ? 'error' : ''}
            disabled={scanning}
          />
          {urlError && <div className="error-msg">{urlError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="additional-urls">Additional URLs</label>
          <textarea
            id="additional-urls"
            placeholder="https://example.com/about (one per line)"
            value={additionalUrls}
            onChange={(e) => setAdditionalUrls(e.target.value)}
            rows={3}
            disabled={scanning}
          />
          <div className="helper-text">{additionalCount}/10 URLs</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="wait-time">Wait Time (ms)</label>
            <input
              id="wait-time"
              type="number"
              min={1000}
              max={10000}
              step={500}
              value={waitTime}
              onChange={(e) =>
                setWaitTime(
                  Math.min(10000, Math.max(1000, Number(e.target.value) || 1000))
                )
              }
              disabled={scanning}
            />
            <div className="helper-text">Range: 1000-10000 ms</div>
          </div>
          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'flex-end' }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid}
              style={{ width: '100%' }}
            >
              {scanning ? (
                <>
                  <span className="spinner" /> Scanning...
                </>
              ) : (
                '🔍 Start Scan'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
