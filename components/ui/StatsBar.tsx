import { cn } from "@/lib/utils/cn";

interface StatItem {
  label: string;
  value: string | number;
}

interface StatsBarProps {
  stats: StatItem[];
  className?: string;
}

export default function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center divide-x divide-gray-200",
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center px-6 py-2"
        >
          <span className="text-2xl font-bold text-navy-800">{stat.value}</span>
          <span className="text-sm text-gray-500">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
