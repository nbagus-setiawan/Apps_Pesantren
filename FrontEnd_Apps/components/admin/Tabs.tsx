'use client';

import clsx from 'clsx';

interface TabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="mb-6 flex gap-1 border-b border-neutral-100">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
