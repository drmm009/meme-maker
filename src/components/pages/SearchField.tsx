// An iOS search field (pages/iosLook.css): a magnifier, the words, and a round button that clears
// them and puts the cursor back.
import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import './iosLook.css';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  // What is being searched, for screen readers.
  label: string;
  placeholder?: string;
  className?: string;
}

export default function SearchField({ value, onChange, label, placeholder = 'Search', className = '' }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`ios-search ${className}`}>
      <Search size={17} className="ios-search-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        className="ios-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        enterKeyHint="search"
      />
      {value && (
        <button
          type="button"
          className="ios-search-clear"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X size={12} strokeWidth={3} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
