import { Search } from 'lucide-react';

export default function Field({ label, children, required = false, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-danger"> *</span>}</label>}
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Cari...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input !pl-9"
      />
    </div>
  );
}
