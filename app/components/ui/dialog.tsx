import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ 
  open, 
  onOpenChange, 
  children 
}) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog content */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}; 