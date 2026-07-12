export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div
      className={`animate-spin rounded-full ${sizes[size]}`}
      style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed' }}
    />
  );
}

export function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Loading...</p>
      </div>
    </div>
  );
}