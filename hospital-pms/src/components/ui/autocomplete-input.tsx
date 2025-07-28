'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  suggestions?: AutocompleteOption[] | string[];
  freeSolo?: boolean; // Allow custom input
  className?: string;
}

export function AutocompleteInput({
  value = '',
  onChange,
  placeholder = 'Select...',
  suggestions = [],
  freeSolo = false,
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  // Normalize suggestions to AutocompleteOption format
  const normalizedSuggestions: AutocompleteOption[] = React.useMemo(() => {
    return suggestions.map((s) =>
      typeof s === 'string' ? { value: s, label: s } : s
    );
  }, [suggestions]);

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue) return normalizedSuggestions;
    
    return normalizedSuggestions.filter((s) =>
      s.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [normalizedSuggestions, inputValue]);

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange?.(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (freeSolo) {
      onChange?.(newValue);
    }
    setOpen(true);
  };

  const handleInputBlur = () => {
    if (freeSolo && inputValue !== value) {
      onChange?.(inputValue);
    }
  };

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (!freeSolo && filteredSuggestions.length > 0) {
    // Combobox mode
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('justify-between', className)}
          >
            {value
              ? normalizedSuggestions.find((s) => s.value === value)?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.value}
                  value={suggestion.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === suggestion.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {suggestion.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Free solo mode with suggestions
  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <Command>
            <CommandGroup>
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.value}
                  value={suggestion.value}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  {suggestion.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
}