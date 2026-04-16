export function RightPanel({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden w-[320px] shrink-0 border-l border-border pl-6 lg:block">
      {children}
    </aside>
  );
}
