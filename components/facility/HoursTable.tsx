import { cn } from "@/lib/utils/cn";
import type { WeeklyHours, DayHours } from "@/lib/types/facility";

interface HoursTableProps {
  hours: WeeklyHours | null;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function getCurrentDay(): (typeof DAYS)[number] {
  const dayIndex = new Date().getDay();
  // getDay() returns 0=Sunday, 1=Monday, ...
  const map: (typeof DAYS)[number][] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[dayIndex];
}

function formatDayHours(day: DayHours | undefined): string {
  if (!day || day.closed) return "Closed";
  return `${day.open} - ${day.close}`;
}

export default function HoursTable({ hours }: HoursTableProps) {
  if (!hours) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
        Contact facility for hours
      </div>
    );
  }

  const currentDay = getCurrentDay();

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {DAYS.map((day) => {
            const isToday = day === currentDay;
            const dayHours = hours[day];

            return (
              <tr
                key={day}
                className={cn(
                  "border-b border-gray-100 last:border-b-0",
                  isToday && "bg-navy-50",
                )}
              >
                <td
                  className={cn(
                    "px-4 py-2.5 font-medium",
                    isToday ? "text-navy-800" : "text-gray-700",
                  )}
                >
                  {DAY_LABELS[day]}
                  {isToday && (
                    <span className="ml-2 text-xs font-normal text-navy-600">
                      (Today)
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right",
                    dayHours?.closed || !dayHours
                      ? "text-gray-400"
                      : isToday
                        ? "text-navy-700 font-medium"
                        : "text-gray-600",
                  )}
                >
                  {formatDayHours(dayHours)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
