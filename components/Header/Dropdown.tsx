'use client';

import { useEffect, useRef, useState } from 'react';
import { getNextIndex } from './dropdownNav';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  ariaLabel,
  theme = 'dark',
  align = 'left',
  className
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  theme?: 'dark' | 'light';
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function openPanel() {
    setHighlightedIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function selectHighlighted() {
    const option = options[highlightedIndex];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Focus never moves off the trigger button (the panel and its options are
  // not focusable) so all keyboard handling lives in one place, branching on
  // whether the panel is currently open.
  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel();
      }
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => getNextIndex(i, e.key as 'ArrowDown' | 'ArrowUp', options.length));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectHighlighted();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  const triggerClass = `${styles.trigger} ${theme === 'light' ? styles.triggerLight : styles.triggerDark}`;

  return (
    <div ref={rootRef} className={`${styles.wrapper} ${className || ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selected?.label}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div role="listbox" className={`${styles.panel} ${align === 'right' ? styles.panelRight : ''}`}>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            const optionClass = [
              styles.option,
              isHighlighted ? styles.optionHighlighted : '',
              isSelected ? styles.optionSelected : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={optionClass}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg className={styles.check} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
