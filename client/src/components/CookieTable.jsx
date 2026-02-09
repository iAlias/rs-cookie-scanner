import React, { useState, useCallback, useRef } from 'react';

const CATEGORIES = ['necessary', 'analytics', 'marketing', 'preferences', 'unknown'];

function formatExpiry(expires) {
  if (!expires || expires < 0) return 'Session';
  const date = new Date(expires * 1000);
  return date.toLocaleDateString();
}

export default function CookieTable({ cookies, onUpdateCookie }) {
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const debounceTimers = useRef({});

  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const toggleExpand = useCallback((key) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(
    (name, domain, field, value) => {
      const timerKey = `${name}|${domain}|${field}`;
      if (debounceTimers.current[timerKey]) {
        clearTimeout(debounceTimers.current[timerKey]);
      }
      debounceTimers.current[timerKey] = setTimeout(() => {
        onUpdateCookie(name, domain, { [field]: value });
      }, 600);
    },
    [onUpdateCookie]
  );

  const handleCategoryChange = useCallback(
    (name, domain, value) => {
      onUpdateCookie(name, domain, { category: value });
    },
    [onUpdateCookie]
  );

  // Filter
  let filtered = cookies.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.name.toLowerCase().includes(q) &&
        !c.domain.toLowerCase().includes(q) &&
        !(c.provider || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filterType !== 'all' && c.partyType !== filterType) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (typeof aVal === 'boolean') {
      aVal = aVal ? 1 : 0;
      bVal = bVal ? 1 : 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const activeFilters = [];
  if (search) activeFilters.push({ label: `Search: ${search}`, clear: () => setSearch('') });
  if (filterType !== 'all')
    activeFilters.push({ label: `Type: ${filterType}`, clear: () => setFilterType('all') });
  if (filterCategory !== 'all')
    activeFilters.push({
      label: `Category: ${filterCategory}`,
      clear: () => setFilterCategory('all'),
    });

  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  if (cookies.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🔍</div>
        <p>No cookies detected on this domain</p>
      </div>
    );
  }

  return (
    <>
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, domain, provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="first">First Party</option>
          <option value="third">Third Party</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {activeFilters.length > 0 && (
        <div className="filter-chips">
          {activeFilters.map((f, i) => (
            <span className="chip" key={i}>
              {f.label}
              <button onClick={f.clear}>×</button>
            </span>
          ))}
        </div>
      )}

      <div className="table-container">
        <table className="cookie-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}></th>
              <th onClick={() => handleSort('name')}>
                Name<span className="sort-indicator">{sortIndicator('name')}</span>
              </th>
              <th onClick={() => handleSort('domain')}>
                Domain<span className="sort-indicator">{sortIndicator('domain')}</span>
              </th>
              <th onClick={() => handleSort('path')}>
                Path<span className="sort-indicator">{sortIndicator('path')}</span>
              </th>
              <th onClick={() => handleSort('partyType')}>
                Type<span className="sort-indicator">{sortIndicator('partyType')}</span>
              </th>
              <th onClick={() => handleSort('httpOnly')}>
                HttpOnly<span className="sort-indicator">{sortIndicator('httpOnly')}</span>
              </th>
              <th onClick={() => handleSort('secure')}>
                Secure<span className="sort-indicator">{sortIndicator('secure')}</span>
              </th>
              <th onClick={() => handleSort('sameSite')}>
                SameSite<span className="sort-indicator">{sortIndicator('sameSite')}</span>
              </th>
              <th onClick={() => handleSort('expires')}>
                Expires<span className="sort-indicator">{sortIndicator('expires')}</span>
              </th>
              <th onClick={() => handleSort('category')}>
                Category<span className="sort-indicator">{sortIndicator('category')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cookie) => {
              const key = `${cookie.name}|||${cookie.domain}`;
              const isExpanded = expandedRows.has(key);
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(key)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </td>
                    <td style={{ fontWeight: 600 }}>{cookie.name}</td>
                    <td>{cookie.domain}</td>
                    <td>{cookie.path}</td>
                    <td>
                      <span className={`party-badge ${cookie.partyType}`}>
                        {cookie.partyType === 'first' ? '1st' : '3rd'}
                      </span>
                    </td>
                    <td>
                      <span className="bool-indicator">
                        {cookie.httpOnly ? '☑' : '☐'}
                      </span>
                    </td>
                    <td>
                      <span className="bool-indicator">
                        {cookie.secure ? '☑' : '☐'}
                      </span>
                    </td>
                    <td>{cookie.sameSite}</td>
                    <td>{formatExpiry(cookie.expires)}</td>
                    <td>
                      <select
                        value={cookie.category}
                        onChange={(e) =>
                          handleCategoryChange(cookie.name, cookie.domain, e.target.value)
                        }
                        style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="expanded-row">
                      <td colSpan={10}>
                        <ExpandedEditor
                          cookie={cookie}
                          onFieldChange={handleFieldChange}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: '8px 12px',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        Showing {filtered.length} of {cookies.length} cookies
      </div>
    </>
  );
}

function ExpandedEditor({ cookie, onFieldChange }) {
  const [provider, setProvider] = useState(cookie.provider || '');
  const [description, setDescription] = useState(cookie.description || '');

  return (
    <div className="expanded-content">
      <div className="form-group">
        <label>Provider</label>
        <input
          type="text"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            onFieldChange(cookie.name, cookie.domain, 'provider', e.target.value);
          }}
          placeholder="e.g. Google, Facebook"
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => {
            const val = e.target.value.slice(0, 500);
            setDescription(val);
            onFieldChange(cookie.name, cookie.domain, 'description', val);
          }}
          placeholder="Cookie description for privacy policy"
          maxLength={500}
        />
        <div className="char-count">{description.length}/500</div>
      </div>
    </div>
  );
}
