import { ReactNode } from 'react';
import clsx from 'clsx';

interface LoadingProps {
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const Loading = ({
  children = '載入中...',
  size = 'md',
  fullScreen = false,
  className,
}: LoadingProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <svg
      className={clsx('animate-spin', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const content = (
    <div
      className={clsx(
        'flex flex-col items-center justify-center',
        {
          'min-h-screen': fullScreen,
          'min-h-[200px]': !fullScreen,
        },
        className
      )}
    >
      <div className="text-primary-600">{spinner}</div>
      {children && (
        <div className="mt-2 text-sm text-gray-500">{children}</div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 z-50">
        {content}
      </div>
    );
  }

  return content;
}; 