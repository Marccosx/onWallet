import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  buttonText?: string;
  onButtonClick?: () => void;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, buttonText, onButtonClick,children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
      
      {buttonText && onButtonClick && (
        <button 
          onClick={onButtonClick}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer text-center"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
