import { describe, expect, it } from 'vitest';

import { dec } from '../../src/api/serialize.js';
import { Dec } from '../../src/portfolio/index.js';

describe('dec (decimal → JSON string)', () => {
  it.each([
    ['0.00000001', '0.00000001'], // toString() would give 1e-8
    ['123456789012345678901234567890', '123456789012345678901234567890'], // and 1.23…e+29
    ['-4401.308497246500000000000000000000000021', '-4401.3084972465'], // engine noise dropped
    ['0.123456789012345678905', '0.1234567890123456789'], // half-even at the 20th place: 0 stays
    ['0.123456789012345678915', '0.12345678901234567892'], // half-even: 1 rounds up to 2
    ['-0', '0'],
    ['-0.000000000000000000001', '0'], // rounds to zero without a minus sign
  ])('writes %s as %s', (input, output) => {
    expect(dec(new Dec(input))).toBe(output);
  });
});
