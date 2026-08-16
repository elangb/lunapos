import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { isOnline, subscribe, queueSize } from '../utils/offline';

/* Badge status offline + jumlah transaksi yang menunggu sinkron */
export default function OfflineBadge() {
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(queueSize());

  useEffect(() => {
    const unsub = subscribe(() => {
      setOnline(isOnline());
      setPending(queueSize());
    });
    return unsub;
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
        online ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      }`}
      title={online ? `${pending} transaksi menunggu sinkronisasi` : 'Mode offline — transaksi disimpan lokal'}
    >
      <WifiOff size={12} />
      {online ? `${pending} menunggu sinkron` : 'Offline'}
    </div>
  );
}
