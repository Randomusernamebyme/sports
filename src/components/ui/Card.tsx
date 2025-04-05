import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  border?: boolean;
}

export const Card = ({ 
  children, 
  className, 
  onClick,
  hover = true,
  border = false
}: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg shadow-md p-6',
        {
          'transition-shadow hover:shadow-lg cursor-pointer': hover && onClick,
          'border border-gray-200': border,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
}

export const CardHeader = ({ 
  children, 
  className,
  border = false 
}: CardHeaderProps) => {
  return (
    <div 
      className={clsx(
        'mb-4',
        {
          'pb-4 border-b border-gray-200': border
        },
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = ({ 
  children, 
  className,
  as: Component = 'h3'
}: CardTitleProps) => {
  return (
    <Component className={clsx('text-xl font-semibold text-gray-900', className)}>
      {children}
    </Component>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => {
  return (
    <div className={clsx('text-gray-600', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
}

export const CardFooter = ({ 
  children, 
  className,
  border = false 
}: CardFooterProps) => {
  return (
    <div 
      className={clsx(
        'mt-4 pt-4',
        {
          'border-t border-gray-200': border
        },
        className
      )}
    >
      {children}
    </div>
  );
}; 