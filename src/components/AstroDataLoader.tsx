import React from 'react';

export default function AstroDataLoader({ loading, error, children }: { loading: boolean; error?: string; children: React.ReactNode }) {
  if (loading) return <div className="p-4 text-center text-indigo-500">Loading astrological data...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  return <>{children}</>;
}
