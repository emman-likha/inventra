interface ReportLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ReportLayout({ title, description, children }: ReportLayoutProps) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-foreground/50 mt-1 text-sm">{description}</p>
      </div>

      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function ReportStatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5">
      <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-foreground/40 text-xs mt-1">{sub}</p>}
    </div>
  );
}
