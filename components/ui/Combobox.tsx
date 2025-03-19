"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ComboboxProps {
  options: { label: string; value: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: { label: string; value: string }) => React.ReactNode;
}

export function Combobox({ 
  options, 
  value, 
  onChange, 
  placeholder = "Выберите", 
  multiple = false,
  disabled = false 
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValue = Array.isArray(value) && value.includes(selectedValue)
        ? value.filter((v) => v !== selectedValue)
        : [...(Array.isArray(value) ? value : []), selectedValue];

      onChange(newValue);
    } else {
      onChange(selectedValue);
      setOpen(false);
    }
  };

  // Get selected labels for display
  const selectedLabels = React.useMemo(() => {
    if (Array.isArray(value) && value.length > 0) {
      return options
        .filter(option => value.includes(option.value))
        .map(option => option.label)
        .join(", ");
    }
    return placeholder;
  }, [value, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={`w-full justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        >
          {selectedLabels}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-[300px] overflow-y-auto">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={
                Array.isArray(value) && value.includes(option.value)
                  ? "secondary"
                  : "ghost"
              }
              className="w-full justify-start font-normal"
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
