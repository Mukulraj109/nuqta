import { useContext } from 'react';
import { ToastContext } from '@/contexts/ToastContext';

/**
 * Hook to access toast notification functionality
 *
 * @returns ToastContextValue with methods to show and dismiss toasts
 * @throws Error if used outside of ToastProvider
 *
 * @example
 * ```tsx
 * const { showSuccess, showError } = useToast();
 *
 * // Show success toast
 * showSuccess('Item added to cart!');
 *
 * // Show error toast with custom duration
 * showError('Failed to load data', 5000);
 *
 * // Show custom toast
 * showToast('Processing...', 'info', 2000);
 *
 * // Dismiss all toasts
 * dismissAll();
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
