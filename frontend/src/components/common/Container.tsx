import React from 'react';

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** When true, omits horizontal gutters (for nested sub-panels or full-width child alignment) */
  noGutter?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  id,
  noGutter = false,
}) => {
  return (
    <div
      id={id}
      className={`w-full max-w-7xl mx-auto ${noGutter ? '' : 'px-4 sm:px-6 lg:px-8'} ${className}`}
    >
      {children}
    </div>
  );
};
