/**
 * Get a safe avatar URL for a Hive user
 * Always uses Hive's image proxy which generates avatars from profile metadata
 * Falls back to a default avatar if needed
 */
export function getHiveAvatarUrl(username: string, size: 'small' | 'medium' | 'large' = 'small'): string {
  if (!username) {
    return '';
  }
  
  const sizeMap = {
    small: 'sm',
    medium: 'md',
    large: 'lg',
  };
  
  return `https://images.hive.blog/u/${username}/avatar/${sizeMap[size]}`;
}

/**
 * Check if a URL is valid and accessible
 * Used for profile images that might be custom URLs
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get profile image URL with fallback to Hive avatar
 */
export function getProfileImageUrl(
  username: string,
  customProfileImage?: string | null,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  // If custom profile image is valid, use it
  if (isValidImageUrl(customProfileImage)) {
    return customProfileImage!;
  }
  
  // Otherwise fallback to Hive's avatar service
  return getHiveAvatarUrl(username, size);
}
