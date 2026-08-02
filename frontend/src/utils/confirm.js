/* Dialog konfirmasi & input SweetAlert2 bertema LunaPOS */
import Swal from 'sweetalert2';

const dialogClass = {
  popup: 'swal-popup',
  title: 'swal-title',
  htmlContainer: 'swal-html',
  confirmButton: 'swal-confirm',
  cancelButton: 'swal-cancel',
  icon: 'swal-icon',
  input: 'swal-input',
  actions: 'swal-actions',
};

/* Konfirmasi -> Promise<boolean> (pengganti window.confirm) */
export async function swalConfirm({
  title = 'Yakin?',
  text = '',
  icon = 'warning',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  danger = false,
} = {}) {
  const res = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    confirmButtonColor: danger ? '#EF4444' : '#2563eb',
    customClass: dialogClass,
  });
  return res.isConfirmed;
}

/* Input -> Promise<string|null> (pengganti window.prompt) */
export async function swalPrompt({
  title = 'Input',
  text = '',
  input = 'text',
  inputPlaceholder = '',
  inputValue = '',
  confirmText = 'Simpan',
  cancelText = 'Batal',
  validationMessage = '',
} = {}) {
  const res = await Swal.fire({
    title,
    text,
    input,
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    confirmButtonColor: '#2563eb',
    inputValidator: validationMessage ? (v) => (v && v.trim() ? null : validationMessage) : undefined,
    customClass: dialogClass,
  });
  return res.isConfirmed ? res.value : null;
}

/* Loading (pengganti loading toast) */
export function swalLoading(title = 'Memproses...', text = '') {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
    customClass: dialogClass,
  });
}

export const swalClose = () => Swal.close();
