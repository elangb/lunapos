export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl lg:text-[1.65rem] font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
