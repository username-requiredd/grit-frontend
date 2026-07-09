// src/hooks/useAlerts.ts
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export const useAlerts = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useMemo(() => {
    const background = isDark ? '#1e1e1e' : '#ffffff';
    const color = isDark ? '#e5e5e5' : '#111827';

    const confirmButtonClass =
      'bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-2.5 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm';
    const dangerButtonClass =
      'bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-6 py-2.5 transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none shadow-sm';
    
    const cancelButtonClass = isDark
      ? 'bg-dark-elevated hover:bg-dark-border text-dark-primary font-medium rounded-lg px-6 py-2.5 transition-colors focus:ring-2 focus:ring-gray-600 focus:outline-none'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-6 py-2.5 transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none';

    const baseConfig: SweetAlertOptions = {
      buttonsStyling: false,
      background,
      color,
      backdrop: 'rgba(0, 0, 0, 0.65)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border ' + (isDark ? 'border-dark-border' : 'border-gray-200'),
        title: 'text-xl font-bold pt-4',
        htmlContainer: 'text-sm mt-2 font-medium ' + (isDark ? 'text-dark-secondary' : ''),
        actions: 'flex flex-row-reverse gap-3 w-full justify-center mt-6',
        confirmButton: confirmButtonClass,
        cancelButton: cancelButtonClass,
      },
    };

    // Extract the shared custom classes into a variable to avoid the getDefaults() TS error
    const baseToastCustomClass = {
      popup: 'rounded-xl shadow-xl border ' + (isDark ? 'border-dark-border' : 'border-gray-200'),
      title: 'text-sm font-bold m-0',
    };

    // Shared mixin config for toasts
    const toastMixin = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background,
      color,
      customClass: baseToastCustomClass,
    });

    return {
      success: (title: string, text?: string, timer?: number) =>
        Swal.fire({
          ...baseConfig,
          icon: 'success',
          title,
          text,
          timer,
          showConfirmButton: !timer,
        }),

      error: (title: string, text?: string) =>
        Swal.fire({
          ...baseConfig,
          icon: 'error',
          title: title || 'Something went wrong',
          text: text || 'We could not complete your request. Please try again.',
        }),

      toastSuccess: (title: string) =>
        toastMixin.fire({
          icon: 'success',
          title,
          customClass: {
            ...baseToastCustomClass, // Use the variable directly
            timerProgressBar: isDark ? 'bg-indigo-400' : 'bg-indigo-600',
          },
        }),

      toastError: (title: string) =>
        toastMixin.fire({
          icon: 'error',
          title,
          customClass: {
            ...baseToastCustomClass, // Use the variable directly
            timerProgressBar: isDark ? 'bg-red-400' : 'bg-red-600',
          },
        }),

      confirmDanger: (title: string, text: string, confirmButtonText = 'Yes, delete it!') =>
        Swal.fire({
          ...baseConfig,
          title,
          text,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText,
          customClass: {
            ...baseConfig.customClass,
            confirmButton: dangerButtonClass,
          },
        }).then((result) => result.isConfirmed),
    };
  }, [isDark]);
};