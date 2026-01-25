import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface ParsedAddress {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
}: AddressAutocompleteProps) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: {
          action: 'autocomplete',
          input,
          sessionToken: sessionTokenRef.current,
        },
      });

      if (error) {
        console.error('Autocomplete error:', error);
        setPredictions([]);
        return;
      }

      setPredictions(data?.predictions || []);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Autocomplete fetch error:', err);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    setShowDropdown(false);
    setIsLoading(true);
    onChange(prediction.structured_formatting.main_text);

    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: {
          action: 'details',
          placeId: prediction.place_id,
          sessionToken: sessionTokenRef.current,
        },
      });

      if (error || !data) {
        console.error('Place details error:', error);
        return;
      }

      // Generate new session token after place selection
      sessionTokenRef.current = crypto.randomUUID();

      onAddressSelect({
        streetAddress: data.streetAddress || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        formattedAddress: data.formattedAddress || '',
      });
    } catch (err) {
      console.error('Place details fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors flex items-start gap-3",
                "hover:bg-accent focus:bg-accent outline-none",
                index === selectedIndex && "bg-accent"
              )}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-muted/30 border-t border-border">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <svg viewBox="0 0 150 20" className="h-3 w-auto opacity-60">
                <path fill="currentColor" d="M28.4 15.1c-2.4 0-4.4-1.9-4.4-4.5s2-4.5 4.4-4.5c1.3 0 2.3.5 3 1.3l-1.2 1.2c-.5-.5-1.1-.7-1.8-.7-1.5 0-2.6 1.2-2.6 2.7s1.1 2.7 2.6 2.7c1 0 1.5-.4 1.9-.7.3-.3.5-.8.6-1.4h-2.5V9.5h4.2c0 .3.1.7.1 1 0 1.2-.3 2.7-1.4 3.8-.9.8-2.1 1.3-3.4 1.3zm11.7-2.6c0 1.9-1.5 3.3-3.4 3.3-1.9 0-3.4-1.4-3.4-3.3s1.5-3.3 3.4-3.3c1.9 0 3.4 1.4 3.4 3.3zm-1.5 0c0-1.2-.9-2-1.9-2s-1.9.9-1.9 2 .9 2 1.9 2 1.9-.9 1.9-2zm9.7 0c0 1.9-1.5 3.3-3.4 3.3-1.9 0-3.4-1.4-3.4-3.3s1.5-3.3 3.4-3.3c1.9 0 3.4 1.4 3.4 3.3zm-1.5 0c0-1.2-.9-2-1.9-2s-1.9.9-1.9 2 .9 2 1.9 2 1.9-.9 1.9-2zm9.2-3.1v5.8c0 2.4-1.4 3.4-3.1 3.4-1.6 0-2.5-.9-2.9-1.7l1.3-.5c.2.5.8 1.1 1.6 1.1.9 0 1.5-.6 1.5-1.7v-.4h0c-.3.4-.9.7-1.6.7-1.5 0-2.9-1.3-2.9-3s1.4-3 2.9-3c.7 0 1.3.3 1.6.7h0v-.5h1.6zm-1.5 2.9c0-.9-.6-1.6-1.4-1.6s-1.5.7-1.5 1.6.6 1.5 1.5 1.5 1.4-.7 1.4-1.5zm4.2-5.2v9.9h-1.6V7.1h1.6zm7.1 7.7-1.2.8c-.4-.6-1-1-1.8-1-1 0-2 .9-2 2s.9 2 2 2c.7 0 1.2-.3 1.5-.6l.3-.4 1.2.8c-.2.3-.5.6-.8.9-.6.5-1.3.8-2.2.8-1.9 0-3.4-1.4-3.4-3.3s1.5-3.3 3.4-3.3c.8 0 1.5.2 2.1.7.3.2.6.5.9.8z" />
              </svg>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
