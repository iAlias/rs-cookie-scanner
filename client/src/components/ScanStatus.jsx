import React, { useState, useEffect } from 'react';

export default function ScanStatus() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: 'Launching browser', done: progress > 10 },
    { label: 'Navigating to URLs', done: progress > 30 },
    { label: 'Waiting for async scripts', done: progress > 60 },
    { label: 'Collecting cookies', done: progress > 80 },
    { label: 'Analyzing results', done: progress > 90 },
  ];

  return (
    <div className="scan-status">
      <h3 style={{ marginBottom: '12px' }}>Scanning in progress...</h3>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(progress, 95)}%` }}
        />
      </div>
      <ul className="scan-steps">
        {steps.map((step, i) => {
          const active =
            !step.done && (i === 0 || steps[i - 1].done);
          return (
            <li key={i}>
              <span className="step-icon">
                {step.done ? '✓' : active ? '⟳' : '•'}
              </span>
              {step.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
