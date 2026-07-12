import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes: Record<string, string> = {
    sm: '400px',
    md: '560px',
    lg: '720px',
    xl: '900px',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: sizes[size],
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '20px',
        background: '#13131f',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, background: '#13131f', zIndex: 1,
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}