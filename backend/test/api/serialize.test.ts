import { describe, expect, it } from 'vitest';

import { dec } from '../../src/api/serialize.js';
import { Dec } from '../../src/portfolio/index.js';

describe('dec (decimal → JSON string)', () => {
  it.each([
    ['0.00000001', '0.00000001'], // toString() would give 1e-8
    ['123456789012345678901234567890', '123456789012345678901234567890'], // and 1.23…e+29
    // An average just above half a cent: cutting it at 20 places would make it exactly 1.005,
    // which the browser then rounds half-even down to $1.00 instead of $1.01.
    ['1.005000000000000000004999', '1.005000000000000000004999'],
    ['-0', '0'],
  ])('writes %s as %s', (input, output) => {
    expect(dec(new Dec(input))).toBe(output);
  });
});
