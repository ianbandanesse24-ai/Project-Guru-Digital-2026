import React from 'react';

/**
 * Focus handler that automatically selects the existing text/number
 * so typing any new number immediately replaces the previous value (e.g. replacing '0' with '1').
 */
export const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};

/**
 * Parses numeric input string, automatically stripping leading zeros when typing
 * (e.g. typing '1' when value was '0' results in '1' rather than '01').
 */
export const parseNumberInput = (value: string, fallback: number = 0, min?: number, max?: number): number => {
  if (value === '') return fallback;
  // Strip leading zeros if followed by another digit (e.g. "01" -> "1")
  const clean = value.replace(/^0+(?=\d)/, '');
  let parsed = parseInt(clean, 10);
  if (isNaN(parsed)) parsed = fallback;
  if (min !== undefined && parsed < min) parsed = min;
  if (max !== undefined && parsed > max) parsed = max;
  return parsed;
};
