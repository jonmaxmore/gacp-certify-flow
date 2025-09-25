import React from 'react';

export function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div style={{ padding: 32, color: 'red', textAlign: 'center' }}>
      <h2>เกิดข้อผิดพลาดในระบบ</h2>
      <p style={{ color: '#800', margin: "16px 0" }}>{error?.message || 'ไม่สามารถโหลดข้อมูลได้'}</p>
      <button
        style={{ padding: 12, background: '#1976d2', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600 }}
        onClick={resetErrorBoundary}
      >
        รีเฟรชหน้านี้
      </button>
    </div>
  );
}