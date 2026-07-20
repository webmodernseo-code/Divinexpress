export function getNextIndex(current: number, key: 'ArrowDown' | 'ArrowUp', length: number): number {
  if (length <= 1) return 0;
  if (key === 'ArrowDown') return (current + 1) % length;
  return (current - 1 + length) % length;
}
