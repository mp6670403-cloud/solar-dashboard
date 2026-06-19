/**
 * UI/Modal.jsx — Reusable modal overlay component
 * 
 * Features:
 * - Dark semi-transparent backdrop with blur
 * - Centered glassmorphism card with smooth scale-in animation
 * - Close button (X) in top-right corner
 * - Title prop displayed in modal header
 * - Click outside (on backdrop) closes the modal
 * - Prevents body scroll when open
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop — click to dismiss */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card — stops click propagation so clicking inside doesn't close */}
      <div
        className={`relative ${maxWidth} w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content area — scrollable if content is long */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
