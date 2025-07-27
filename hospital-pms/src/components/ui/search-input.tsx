'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
  debounce?: number;
  showButton?: boolean;
  autoFocus?: boolean;
  clearable?: boolean;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = '검색...',
  className,
  loading = false,
  debounce = 300,
  showButton = true,
  autoFocus = false,
  clearable = true,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isSearching, setIsSearching] = useState(false);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Debounced search
  useEffect(() => {
    if (!onSearch || showButton) return;

    const timer = setTimeout(() => {
      if (value) {
        setIsSearching(true);
        onSearch(value);
        setIsSearching(false);
      }
    }, debounce);

    return () => clearTimeout(timer);
  }, [value, onSearch, debounce, showButton]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleSearch = () => {
    if (onSearch && value) {
      setIsSearching(true);
      onSearch(value);
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      handleSearch();
    }
  };

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9"
          autoFocus={autoFocus}
          aria-label="검색 입력"
        />
        {(loading || isSearching) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!loading && !isSearching && clearable && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {showButton && onSearch && (
        <Button
          type="button"
          size="default"
          onClick={handleSearch}
          disabled={!value || loading || isSearching}
        >
          검색
        </Button>
      )}
    </div>
  );
}

interface SearchBarProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
  showSuggestions?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = '검색어를 입력하세요',
  className,
  suggestions = [],
  showSuggestions = true,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [value, suggestions]);

  const handleSelect = (suggestion: string) => {
    setValue(suggestion);
    setShowDropdown(false);
    onSearch(suggestion);
  };

  return (
    <div className={cn('relative', className)}>
      <SearchInput
        value={value}
        onChange={setValue}
        onSearch={onSearch}
        placeholder={placeholder}
        showButton={false}
      />
      {showSuggestions && showDropdown && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}