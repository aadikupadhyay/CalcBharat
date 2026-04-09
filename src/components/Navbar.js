'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOOLS } from '@/data/tools';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    const matches = TOOLS.filter(t =>
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.desc.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6);
    setResults(matches);
    setShowResults(matches.length > 0);
  };

  return (
    <nav className="main-nav">
      <Link href="/" className="brand">Calc<span>Bharat</span></Link>
      <div className="nav-search" ref={searchRef}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search calculators..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          autoComplete="off"
        />
        {showResults && (
          <div className="search-results">
            {results.map(t => (
              <Link
                key={t.id}
                href={`/${t.category}/${t.slug}/`}
                className="search-item"
                onClick={() => { setShowResults(false); setQuery(''); }}
              >
                {t.icon} {t.name}
                <span className="search-cat">{t.category}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="nav-links">
        <Link
          href="/calculators/"
          className={`nav-link ${pathname === '/calculators/' || pathname === '/calculators' ? 'active' : ''}`}
        >
          📋 <span className="link-text">All Calculators</span>
        </Link>
        <Link href="/about/" className="nav-link">
          <span className="link-text">About</span>
        </Link>
      </div>
    </nav>
  );
}
