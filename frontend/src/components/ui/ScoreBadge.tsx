import { cn, getScoreBgColor, getScoreLabel } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = 'md', showLabel = false, className }: ScoreBadgeProps) {
  const roundedScore = Math.round(score);
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'flex items-center justify-center font-bold text-white rounded-lg shadow-sm',
          sizeClasses[size],
          getScoreBgColor(roundedScore)
        )}
        title={`${getScoreLabel(roundedScore)} Match`}
      >
        {roundedScore}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600">
          {getScoreLabel(roundedScore)}
        </span>
      )}
    </div>
  );
}
