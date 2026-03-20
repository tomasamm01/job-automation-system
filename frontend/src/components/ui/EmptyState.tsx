import { Inbox, Search, FileX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'file';
  action?: React.ReactNode;
}

const icons = {
  inbox: Inbox,
  search: Search,
  file: FileX,
};

export function EmptyState({ title, description, icon = 'inbox', action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
