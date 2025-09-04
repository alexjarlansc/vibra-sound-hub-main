import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

// Contêiner padronizado para páginas internas
export function PageShell({ title, subtitle, children, className, headerRight }: PageShellProps){
  return (
    <div className={cn('max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6', className)}>
      {(title || subtitle || headerRight) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            {title && <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default PageShell;
