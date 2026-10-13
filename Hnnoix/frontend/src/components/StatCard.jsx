import React from 'react';

export function StatCard({ label, value, subtext, icon, isFeatured = false }) {
  return (
    <div className={`stat-card ${isFeatured ? 'featured-card' : ''}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-footer">{subtext}</div>}
    </div>
  );
}
