/**
 * Stub for Checkbox component
 * TODO: Implement full checkbox functionality
 */

"use client";

import React from "react";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, disabled, className, id }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={className}
      id={id}
    />
  );
};
