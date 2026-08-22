import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Optional category filter dropdown on the right side of the bar. */
  selectOptions?: SearchSelectOption[];
  selectValue?: string;
  onSelectChange?: (value: string) => void;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search channels...",
  className,
  autoFocus = false,
  selectOptions,
  selectValue,
  onSelectChange,
}: SearchBarProps) => {
  const hasSelect = Boolean(selectOptions && selectOptions.length > 0);

  return (
    <div
      className={cn(
        'bg-search-bg border border-border/70 rounded-xl h-9 px-2.5 flex items-center justify-between shadow-inner',
        'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
        'transition-all duration-200',
        className
      )}
    >
      {/* Left: search icon + input */}
      <div className="flex items-center min-w-0 flex-1">
        <Search className="w-4 h-4 text-search-icon mr-2 flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          aria-label={placeholder}
          className="bg-transparent text-sm text-foreground placeholder:text-search-placeholder outline-none w-full min-w-0 pr-2"
        />
      </div>

      {/* Clear button */}
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Right: category select behind a divider */}
      {hasSelect && (
        <>
          <div className="h-4 w-[1px] bg-border/80 mx-2 flex-shrink-0" aria-hidden />
          <div className="relative flex-shrink-0">
            <select
              value={selectValue}
              onChange={(e) => onSelectChange?.(e.target.value)}
              aria-label="Filter by category"
              className="appearance-none flex items-center gap-1 text-xs font-medium text-foreground/80 bg-muted hover:bg-muted/70 pl-2 pr-6 py-1 rounded-lg cursor-pointer transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {selectOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          </div>
        </>
      )}
    </div>
  );
};

export default SearchBar;
