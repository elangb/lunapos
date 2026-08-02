/* Wrapper SweetAlert2 untuk notifikasi — API sama dengan react-hot-toast (success/error/info/warning),
   agar semua pemanggilan `toast.xxx(...)` di project tidak perlu diubah. */
import Swal from 'sweetalert2';

const base = {
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  showCloseButton: false,
  timer: 2200,
  timerProgressBar: true,
  customClass: {
    popup: 'swal-toast-popup',
    title: 'swal-toast-title',
    icon: 'swal-icon',
    timerProgressBar: 'swal-timer-bar',
  },
  didOpen: (el) => {
    el.addEventListener('mouseenter', () => Swal.stopTimer());
    el.addEventListener('mouseleave', () => Swal.resumeTimer());
  },
};

export const toast = {
  success: (msg, opts = {}) => Swal.fire({ ...base, icon: 'success', title: msg, timer: opts.duration ?? 2200, ...opts }),
  error: (msg, opts = {}) => Swal.fire({ ...base, icon: 'error', title: msg, timer: opts.duration ?? 3000, ...opts }),
  info: (msg, opts = {}) => Swal.fire({ ...base, icon: 'info', title: msg, timer: opts.duration ?? 2200, ...opts }),
  warning: (msg, opts = {}) => Swal.fire({ ...base, icon: 'warning', title: msg, timer: opts.duration ?? 2500, ...opts }),
  dismiss: () => Swal.close(),
};

export default toast;
