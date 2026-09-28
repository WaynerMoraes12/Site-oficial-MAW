import { describe, expect, it } from 'vitest';
import { visibleChannels, type Channel } from '../../src/lib/channels';

const c = (id: string, href: string): Channel => ({ id, label: id, value: id, href, icon: id });

describe('visibleChannels', () => {
  it('keeps only channels with a usable link, in order', () => {
    const list = [c('email', 'mailto:a@b.com'), c('ig', ''), c('yt', 'https://youtube.com/@maw'), c('dc', '   ')];
    expect(visibleChannels(list).map((x) => x.id)).toEqual(['email', 'yt']);
  });
  it('rejects http and javascript links', () => {
    expect(visibleChannels([c('a', 'http://x.com'), c('b', 'javascript:alert(1)')])).toEqual([]);
  });
  it('rejects a malformed mailto', () => {
    expect(visibleChannels([c('a', 'mailto:not-an-email')])).toEqual([]);
  });
});
