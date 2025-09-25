import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateInput, sanitizeString } from '@/utils/inputValidation';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface SecureInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'thai-id';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  sensitive?: boolean; // For fields like Thai ID
  maxLength?: number;
  className?: string;
}

export const SecureInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  sensitive = false,
  maxLength,
  className
}: SecureInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Validate and sanitize input
    const validation = validateInput(inputValue, type === 'email' ? 'email' : 'text');
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: validation.errors.join(', ')
      });
      return;
    }
    
    setValidationErrors([]);
    onChange(validation.sanitized);
  };

  // Thai ID specific formatting
  const formatThaiId = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 1) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
    if (digits.length <= 9) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
    if (digits.length <= 11) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}-${digits.slice(9)}`;
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 11)}-${digits.slice(11, 13)}`;
  };

  const displayValue = type === 'thai-id' ? formatThaiId(value) : value;
  const inputType = type === 'password' && showPassword ? 'text' : 
                   type === 'thai-id' ? 'text' : type;

  // Prevent copy/paste for sensitive fields
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (sensitive && (e.ctrlKey || e.metaKey)) {
      if (e.key === 'c' || e.key === 'v' || e.key === 'x') {
        e.preventDefault();
        toast({
          variant: "destructive",
          title: "Security Restriction",
          description: "Copy/paste is disabled for sensitive fields"
        });
      }
    }
  };

  // Disable right-click context menu for sensitive fields
  const handleContextMenu = (e: React.MouseEvent) => {
    if (sensitive) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    // Add security attributes to sensitive inputs
    if (sensitive && inputRef.current) {
      inputRef.current.setAttribute('autocomplete', 'off');
      inputRef.current.setAttribute('data-sensitive', 'true');
    }
  }, [sensitive]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="flex items-center gap-2">
        {label}
        {sensitive && <Shield className="w-3 h-3 text-orange-500" />}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type={inputType}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength || (type === 'thai-id' ? 17 : undefined)} // Include dashes
          className={`${validationErrors.length > 0 ? 'border-destructive' : ''} ${
            sensitive ? 'font-mono' : ''
          }`}
          autoComplete={sensitive ? 'off' : undefined}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {validationErrors.length > 0 && (
        <div className="text-xs text-destructive space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      
      {sensitive && isFocused && (
        <div className="text-xs text-orange-600 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Sensitive data - protected input
        </div>
      )}
    </div>
  );
};