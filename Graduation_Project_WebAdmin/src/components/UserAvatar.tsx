import { useState } from 'react';
import { Avatar } from 'antd';

function initials(name?: string) {
  const parts = (name || 'U').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
}

function mediaUrl(url?: string | null) {
  if (!url) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (value.startsWith('/')) return value;
  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'localhost' && window.location.hostname !== 'localhost') {
      return `${window.location.origin}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return undefined;
  }
  return value;
}

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: number;
  color?: string;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, size = 40, color = '#EC4899', className }: UserAvatarProps) {
  const source = mediaUrl(avatarUrl);
  const [failed, setFailed] = useState(false);

  return (
    <Avatar
      shape="square"
      size={size}
      src={!failed ? source : undefined}
      onError={() => { setFailed(true); return false; }}
      className={`user-avatar${className ? ` ${className}` : ''}`}
      style={{ backgroundColor: color, flexShrink: 0 }}
    >
      {initials(name)}
    </Avatar>
  );
}
