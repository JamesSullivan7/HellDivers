"use client";

interface Props {
  children: React.ReactNode;
  label?: string;
}

export default function RightContextPanel({ children, label }: Props) {
  return (
    <aside className="hidden xl:flex w-[300px] shrink-0 border-l border-border-strong bg-bg-secondary/65 backdrop-blur-md flex-col overflow-hidden">
      {label && (
        <div className="px-tok-3 py-tok-3 border-b border-border-subtle">
          <div className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono">
            ◢ {label}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-tok-3 space-y-tok-3">
        {children}
      </div>
    </aside>
  );
}
