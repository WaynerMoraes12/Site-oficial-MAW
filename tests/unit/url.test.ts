import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/url';

describe('withBase', () => {
  it('joins a path to the root base', () => {
    expect(withBase('press/logo.png', '/')).toBe('/press/logo.png');
  });
  it('accepts a base without trailing slash', () => {
    expect(withBase('/press/logo.png', '/Site-oficial-MAW')).toBe('/Site-oficial-MAW/press/logo.png');
  });
  it('accepts a base with trailing slash and a path with leading slashes', () => {
    expect(withBase('//og-image.png', '/Site-oficial-MAW/')).toBe('/Site-oficial-MAW/og-image.png');
  });
  it('returns the base itself for an empty path', () => {
    expect(withBase('', '/Site-oficial-MAW')).toBe('/Site-oficial-MAW/');
  });
});
