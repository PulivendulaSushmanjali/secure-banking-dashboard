import React from 'react';
import { Shield, LayoutDashboard, CreditCard, ArrowLeftRight, UserCheck, PlusCircle } from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, onOpenSimulate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ background: '#0284c7', padding: '8px', borderRadius: '10px', display: 'flex' }}>
          <Shield size={22} color="#ffffff" />
        </div>
        <div className="brand-title">FORTIS VAULT</div>
      </div>

      <div className="sidebar-nav">
        <button
          onClick={() => setActiveTab('overview')}
          className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`sidebar-link ${activeTab === 'transactions' ? 'active' : ''}`}
        >
          <ArrowLeftRight size={18} />
          <span>Transactions</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`sidebar-link ${activeTab === 'account' ? 'active' : ''}`}
        >
          <CreditCard size={18} />
          <span>Account Details</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <UserCheck size={18} />
          <span>User Profile</span>
        </button>

        <div style={{ marginTop: '24px', padding: '0 8px' }}>
          <button
            onClick={onOpenSimulate}
            className="btn btn-primary btn-block"
            style={{ fontSize: '13px', padding: '10px 14px', background: '#0369a1' }}
          >
            <PlusCircle size={16} />
            <span>Simulate Transfer</span>
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-security-badge">
          <Shield size={18} color="var(--emerald)" />
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>Demo Safe Mode</div>
            <div style={{ fontSize: '11px' }}>Simulated banking data only</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
