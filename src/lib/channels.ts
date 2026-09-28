export interface Channel {
  id: string;
  label: string;
  value: string;
  href: string;
  icon: string;
}

// Canal só aparece com link utilizável: mailto válido ou https.
export function visibleChannels(list: readonly Channel[]): Channel[] {
  return list.filter((c) => {
    const href = c.href.trim();
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href) || /^https:\/\/\S+$/.test(href);
  });
}
