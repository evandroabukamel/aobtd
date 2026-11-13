import { describe, expect, it } from 'vitest';
import { cn } from '../src/presentation/shared/utils';

describe('cn', () => {
  it('joins classes, drops falsy ones, and lets a later Tailwind utility win', () => {
    expect(cn('px-2 text-sm', false, undefined, 'px-4')).toBe('text-sm px-4');
  });
});
