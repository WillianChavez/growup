'use client';

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(
    null
  );

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setOnConfirmCallback(() => async () => {
        setIsOpen(false);
        resolve(true);
      });
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (onConfirmCallback) {
      await onConfirmCallback();
    }
    setIsOpen(false);
    setOnConfirmCallback(null);
  }, [onConfirmCallback]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setOnConfirmCallback(null);
  }, []);

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
