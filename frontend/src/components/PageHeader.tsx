import React, { ReactNode } from 'react';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions, className = '' }) => {
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 ${className}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="bg-teal-500/10 dark:bg-teal-500/20 p-2 rounded-xl shrink-0 flex items-center justify-center">
                        <div className="text-teal-600 dark:text-teal-400">
                            {icon}
                        </div>
                    </div>
                )}
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
