import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LocationSuggestion, LocationInputProps } from '@/types/location';
import { 
  searchCities, 
  validateLocationInput, 
  getPopularCities,
  getSimilarCitySuggestions
} from '@/utils/locationUtils';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, CheckCircle, XCircle, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ValidationState = 'idle' | 'valid' | 'invalid' | 'validating';

const MAX_SUGGESTIONS = 5;

export const LocationInput = React.forwardRef<HTMLInputElement, LocationInputProps>(
  ({ value, onChange, onSelect, placeholder = 'Enter a city', className = '', error, disabled = false }, ref) => {
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [popularCities, setPopularCities] = useState<LocationSuggestion[]>([]);
    const [similarCities, setSimilarCities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [inputError, setInputError] = useState<string | undefined>(error);
    const [validationState, setValidationState] = useState<ValidationState>('idle');
    const [hasSelected, setHasSelected] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external error state
    useEffect(() => {
      setInputError(error);
    }, [error]);

    // Handle clicks outside to close suggestions
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Load popular cities on mount
    useEffect(() => {
      setPopularCities(getPopularCities(5));
    }, []);

    // Debounced search
    const searchLocations = useCallback(() => {
      if (!value.trim()) {
        setSuggestions([]);
        setSimilarCities([]);
        setValidationState('idle');
        setInputError(undefined);
        setHasSelected(false);
        setShowSuggestions(false);
        return;
      }

      const validation = validateLocationInput(value);
      if (!validation.isValid) {
        setInputError(validation.error);
        setSuggestions([]);
        setSimilarCities([]);
        setValidationState('invalid');
        return;
      }

      setInputError(undefined);
      setValidationState('validating');
      setIsLoading(true);

      const timer = setTimeout(() => {
        const { results, hasExactMatch } = searchCities(value, MAX_SUGGESTIONS);
        setSuggestions(results);
        
        // Get similar city suggestions if no exact matches
        if (!hasExactMatch && results.length === 0) {
          const similar = getSimilarCitySuggestions(value, 3);
          setSimilarCities(similar);
          setValidationState('invalid');
          setInputError(similar.length > 0 
            ? 'No exact matches. Did you mean one of these?' 
            : 'No matching locations found');
        } else if (hasSelected) {
          setValidationState('valid');
          setSimilarCities([]);
        } else {
          setValidationState('idle');
          setSimilarCities([]);
        }
        
        setIsLoading(false);
        setShowSuggestions(true);
      }, 300);

      return () => clearTimeout(timer);
    }, [value, hasSelected]);

    // Run search when value changes
    useEffect(() => {
      searchLocations();
    }, [searchLocations]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleSelect = (suggestion: LocationSuggestion) => {
      onSelect(suggestion);
      setSuggestions([]);
      setSimilarCities([]);
      setValidationState('valid');
      setHasSelected(true);
      setShowSuggestions(false);
      inputRef.current?.blur();
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setShowSuggestions(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Use setTimeout to allow click events on suggestions to fire first
      setTimeout(() => {
        setIsFocused(false);
        setShowSuggestions(false);
      }, 200);
    };

    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <div className="relative">
          <div className="relative">
            <Input
              ref={(node) => {
                if (ref) {
                  if (typeof ref === 'function') {
                    ref(node);
                  } else {
                    ref.current = node;
                  }
                }
                // @ts-ignore
                inputRef.current = node;
              }}
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'pr-10 transition-colors',
                inputError ? 'border-red-500 focus-visible:ring-red-500' : '',
                validationState === 'valid' ? 'border-green-500 focus-visible:ring-green-500' : '',
                validationState === 'validating' ? 'border-amber-500' : ''
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {validationState === 'validating' || isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              ) : validationState === 'valid' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : inputError ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {showSuggestions && (suggestions.length > 0 || similarCities.length > 0 || popularCities.length > 0) && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
            {/* Exact matches */}
            {suggestions.length > 0 && (
              <div className="p-2 text-xs font-medium text-muted-foreground border-b">
                Matching locations
              </div>
            )}
            {suggestions.map((suggestion, index) => {
              const displayName = `${suggestion.name}${suggestion.admin1 ? `, ${suggestion.admin1}` : ''}, ${suggestion.country}`;
              const searchValue = value.toLowerCase();
              const matchIndex = displayName.toLowerCase().indexOf(searchValue);
              
              // Create a unique key using all available identifiers
              const uniqueKey = [
                'suggestion',
                suggestion.name,
                suggestion.countryCode,
                suggestion.latitude?.toFixed(4),
                suggestion.longitude?.toFixed(4),
                index
              ].filter(Boolean).join('-');
              
              return (
                <div
                  key={uniqueKey}
                  className="cursor-pointer p-2 hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={() => handleSelect(suggestion)}
                >
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {matchIndex >= 0 ? (
                          <>
                            {displayName.substring(0, matchIndex)}
                            <span className="font-bold text-blue-600">
                              {displayName.substring(matchIndex, matchIndex + searchValue.length)}
                            </span>
                            {displayName.substring(matchIndex + searchValue.length)}
                          </>
                        ) : displayName}
                      </div>
                      {suggestion.timezone && (
                        <div className="text-xs text-muted-foreground truncate">
                          Timezone: {suggestion.timezone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Similar city suggestions */}
            {similarCities.length > 0 && (
              <>
                <div className="p-2 text-xs font-medium text-muted-foreground border-t border-b">
                  Did you mean?
                </div>
                {similarCities.map((cityName, index) => (
                  <div
                    key={`similar-${cityName}-${index}`}
                    className="cursor-pointer p-2 hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={() => onChange(cityName)}
                  >
                    <div className="flex items-center">
                      <Search className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="font-medium">{cityName}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Popular cities */}
            {suggestions.length === 0 && similarCities.length === 0 && popularCities.length > 0 && (
              <>
                <div className="p-2 text-xs font-medium text-muted-foreground border-t">
                  Popular cities
                </div>
                {popularCities.map((city, index) => (
                  <div
                    key={`popular-${city.name}-${city.countryCode}-${index}`}
                    className="cursor-pointer p-2 hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={() => handleSelect(city)}
                  >
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="font-medium">
                        {city.name}, {city.country}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {(inputError || validationState === 'valid') && (
          <div className={cn(
            'mt-1 text-xs flex items-center',
            inputError ? 'text-red-500' : 'text-green-600'
          )}>
            {inputError ? (
              <>
                <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{inputError}</span>
              </>
            ) : validationState === 'valid' ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Location selected: {value}</span>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

LocationInput.displayName = 'LocationInput';
