import { expect, it } from 'vitest';
import { formatUnits, parseUnits } from './amounts';

it('preserves integer precision beyond Number.MAX_SAFE_INTEGER', () => {
  expect(parseUnits('9007199.254740993', 9)).toBe(9007199254740993n);
  expect(formatUnits(9007199254740993n, 9)).toBe('9007199.254740993');
  expect(formatUnits(0n, 9)).toBe('0');
});
it('accepts either decimal separator without treating it as grouping', () => {
  expect(parseUnits('1,23', 6)).toBe(1230000n);
  expect(parseUnits('1.23', 6)).toBe(1230000n);
  for (const value of ['1,234,567', '1.234.567', '1,234.56', '1.234,56', '1 234,56']) {
    expect(() => parseUnits(value, 6)).toThrow();
  }
});
it.each(['0', '-1', '1e3', '1.0000000001', 'NaN', '18446744073709551616'])(
  'rejects unsafe amount %s',
  (value) => expect(() => parseUnits(value, 9)).toThrow(),
);
