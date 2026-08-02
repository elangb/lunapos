import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, sub, icon: Icon, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    secondary: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    ink: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300',
  };
  return (
    <div className="card p-4 lg:p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-ink-400 uppercase tracking-wider">{title}</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-xs text-ink-400 flex items-center gap-1">{sub}</div>}
          {trend !== undefined && trend !== null && (
            <div className={`mt-1 text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
              {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(trend)}% dari periode lalu
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colors[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
