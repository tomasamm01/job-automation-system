import type { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { EmptyState } from './EmptyState';

interface QueryStateHandlerProps<T> {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}

export function QueryStateHandler<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty,
  loadingMessage,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  onRetry,
  children,
}: QueryStateHandlerProps<T>) {
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'An error occurred while loading data'}
        onRetry={onRetry}
      />
    );
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children(data)}</>;
}
