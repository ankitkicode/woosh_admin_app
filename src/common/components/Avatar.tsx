import { cn } from '../utils/cn';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

const colors = [
  'bg-pink-100 text-pink-700',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
];

function getColorFromName(name: string): string {
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  const colorClass = name ? getColorFromName(name) : colors[0];

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold",
        sizeMap[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
