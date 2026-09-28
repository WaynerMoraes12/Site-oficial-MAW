import type { Channel } from '../lib/channels';
import site from './site.json';

// Canal com href vazio não aparece no site. Preencher quando o perfil existir.
export const channels: Channel[] = [
  { id: 'email', label: 'Official e-mail', value: 'waynerbusiness@outlook.com', href: 'mailto:waynerbusiness@outlook.com', icon: '@' },
  { id: 'instagram', label: 'Instagram', value: '', href: '', icon: 'IG' },
  { id: 'youtube', label: 'YouTube', value: '', href: '', icon: 'YT' },
  { id: 'discord', label: 'Discord', value: '', href: '', icon: 'DC' },
  { id: 'tiktok', label: 'TikTok', value: '', href: '', icon: 'TT' },
  { id: 'source', label: 'Source code', value: 'GNU GPL v3', href: site.sourceCodeUrl, icon: '</>' },
];
