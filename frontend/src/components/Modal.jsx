import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, size = 'md', closable = true }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closable ? onClose : undefined} />
      <div className={`relative card w-full ${sizes[size]} max-h-[92vh] flex flex-col animate-scale-in shadow-strong`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-700">
          <h3 className="font-bold text-lg">{title}</h3>
          {closable && (
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-ink-100 dark:border-ink-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
