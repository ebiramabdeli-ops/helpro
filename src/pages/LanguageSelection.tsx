import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './LanguageSelection.css';
import languages from '../data/languages.json';

interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  priority: number;
}

export default function LanguageSelection() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort languages
  const filteredLanguages = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return (languages as Language[])
      .filter(lang => 
        lang.label.toLowerCase().includes(query) ||
        lang.nativeLabel.toLowerCase().includes(query)
      )
      .sort((a, b) => a.priority - b.priority);
  }, [searchQuery]);

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    // Save to localStorage immediately
    localStorage.setItem('helpro_language', code);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Set i18n language
      const shortCode = selectedLanguage.split('-')[0]; // en-GB -> en
      localStorage.setItem('i18n_language', shortCode);
      
      // Navigate to next screen (home or dashboard)
      navigate('/');
    }
  };

  const selectedLangData = languages.find(l => l.code === selectedLanguage);

  return (
    <div className="language-selection">
      <div className="language-selection__container">
        
        {/* Header */}
        <header className="language-selection__header">
          <h1 className="language-selection__title">My Language</h1>
          <p className="language-selection__subtitle">
            Choose the language you're most comfortable with
          </p>
        </header>

        {/* Search Bar */}
        <div className="language-selection__search">
          <span className="language-selection__search-icon">🔍</span>
          <input
            type="text"
            className="language-selection__search-input"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search languages"
          />
        </div>

        {/* Status Message */}
        {selectedLangData && (
          <div className="language-selection__status">
            {selectedLangData.nativeLabel} selected ✔️
          </div>
        )}

        {/* Language List */}
        <div className="language-selection__list">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              className={`language-item ${
                selectedLanguage === lang.code ? 'language-item--selected' : ''
              }`}
              onClick={() => handleLanguageSelect(lang.code)}
              aria-label={`Select ${lang.label}`}
            >
              <span className="language-item__flag" aria-hidden="true">
                {lang.flag}
              </span>
              <div className="language-item__text">
                <span className="language-item__label">{lang.label}</span>
                <span className="language-item__native">{lang.nativeLabel}</span>
              </div>
              <span className="language-item__indicator">
                {selectedLanguage === lang.code ? '●' : '○'}
              </span>
            </button>
          ))}
        </div>

        {/* No Results */}
        {filteredLanguages.length === 0 && (
          <div className="language-selection__no-results">
            No languages found
          </div>
        )}

        {/* Continue Button */}
        <div className="language-selection__footer">
          <button
            className="language-selection__continue"
            onClick={handleContinue}
            disabled={!selectedLanguage}
            aria-label="Continue to next step"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
