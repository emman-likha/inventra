const shimmer = "animate-pulse bg-foreground/[0.06] rounded-lg";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`${shimmer} ${className}`} />;
}

export function SkeletonTableRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-foreground/[0.06] last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <SkeletonLine className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-foreground/[0.08]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3.5">
                <SkeletonLine className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5">
          <SkeletonLine className="h-3 w-20 mb-3" />
          <SkeletonLine className="h-7 w-12 mb-2" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ header = true, search = true, table = true, cols = 5, statCards = 0 }: {
  header?: boolean;
  search?: boolean;
  table?: boolean;
  cols?: number;
  statCards?: number;
}) {
  return (
    <div>
      {header && (
        <div className="mb-8">
          <SkeletonLine className="h-8 w-48 mb-2" />
          <SkeletonLine className="h-4 w-64" />
        </div>
      )}
      {statCards > 0 && (
        <div className="mb-10">
          <SkeletonStatCards count={statCards} />
        </div>
      )}
      {search && (
        <div className="mb-6">
          <SkeletonLine className="h-10 w-full max-w-sm rounded-xl" />
        </div>
      )}
      {table && <SkeletonTable cols={cols} />}
    </div>
  );
}
