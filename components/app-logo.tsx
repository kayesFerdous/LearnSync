import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function AppLogo({
  className,
  iconClassName,
  showWordmark = false,
  wordmarkClassName,
  width = 96,
  height = 36,
  priority = false,
}: AppLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/logo.svg"
        alt="LearnSync logo"
        width={width}
        height={height}
        priority={priority}
        className={cn('h-auto w-auto object-contain', iconClassName)}
      />
      {showWordmark && (
        <span className={cn('text-sm font-semibold tracking-tight text-foreground', wordmarkClassName)}>
          LearnSync
        </span>
      )}
    </div>
  );
}
