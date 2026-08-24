import React from 'react';
import { cn } from '../../lib/utils';

// Define a more specific props interface to handle the custom onCheckedChange prop
interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    // The native onChange event for an input element
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Call the custom onCheckedChange handler with the boolean value
      onCheckedChange?.(event.target.checked);
    };

    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
        <input 
          type="checkbox" 
          ref={ref} 
          className="sr-only peer" 
          onChange={handleChange} // Use the standard onChange event
          {...props} // Spread the rest of the props (like `checked`, `id`, `disabled`)
        />
        <div className="w-11 h-6 bg-secondary rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-background peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
