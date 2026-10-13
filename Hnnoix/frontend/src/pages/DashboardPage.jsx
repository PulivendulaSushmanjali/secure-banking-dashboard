import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { TransactionTable } from '../components/TransactionTable';
import { Modal } from '../components/Modal';
import { AlertNotification } from '../components/AlertNotification';

export function DashboardPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        api.account.getAccount(),
        api.transactions.getTransactions(),
      ]);
      setAccount(accRes.account);
      setTransactions(txRes.transactions);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load banking dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleSimulateTransaction = async ({ type, amount, description }) => {
    const res = await api.transactions.simulate({ type, amount, description });
    setSuccessMsg(res.message);
    await fetchDashboardData();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSimulate={() => setIsModalOpen(true)}
      />

      <div className="dashboard-main">
        <Navbar />

        <main className="dashboard-content">
          {/* Welcome Header */}
          <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="welcome-title">Welcome, {user?.name || 'Customer'}</h1>
              <p className="welcome-subtitle">
                Fortis Online Banking &bull; Personal Account Dashboard
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRefresh}
                className="btn btn-secondary"
                disabled={refreshing}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <ArrowUpRight size={14} />
                <span>New Transaction</span>
              </button>
            </div>
          </div>

          <AlertNotification type="error" message={error} onClose={() => setError('')} />
          <AlertNotification type="success" message={successMsg} onClose={() => setSuccessMsg('')} />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600 }}>Loading secure banking data...</p>
            </div>
          ) : (
            <>
              {/* Account Overview Cards */}
              <div className="cards-grid">
                <StatCard
                  isFeatured={true}
                  label="Available Balance"
                  value={account?.formattedBalance || '₹50,000.00'}
                  subtext="Updated in real time &bull; Savings Account"
                  icon={<Wallet size={22} />}
                />

                <StatCard
                  label="Account Number"
                  value={account?.accountNumberMasked || 'XXXX XXXX 1234'}
                  subtext={`Type: ${account?.accountType || 'Savings'} | Status: Active`}
                  icon={<CreditCard size={22} />}
                />

                <StatCard
                  label="Security & Two-Factor"
                  value="2FA ACTIVE"
                  subtext="OTP Protected &bull; SHA-256 Hashed"
                  icon={<ShieldCheck size={22} color="var(--emerald)" />}
                />
              </div>

              {/* View selection rendering */}
              {activeTab === 'overview' && (
                <>
                  <TransactionTable transactions={transactions} />

                  <div className="section-container">
                    <div className="section-header">
                      <h2 className="section-title">Customer Profile Information</h2>
                    </div>

                    <div className="profile-card">
                      <div>
                        <div className="profile-field-label">Account Holder</div>
                        <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="var(--primary)" />
                          {user?.name}
                        </div>
                      </div>

                      <div>
                        <div className="profile-field-label">Email Address</div>
                        <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={16} color="var(--primary)" />
                          {user?.email}
                        </div>
                      </div>

                      <div>
                        <div className="profile-field-label">Mobile Number</div>
                        <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Phone size={16} color="var(--primary)" />
                          +91 {user?.mobile}
                        </div>
                      </div>

                      <div>
                        <div className="profile-field-label">Account Type</div>
                        <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCard size={16} color="var(--primary)" />
                          {account?.accountType || 'Savings'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'transactions' && (
                <TransactionTable transactions={transactions} />
              )}

              {activeTab === 'account' && (
                <div className="section-container">
                  <div className="section-header">
                    <h2 className="section-title">Account Details & Specifications</h2>
                  </div>
                  <div className="profile-card" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <div>
                      <div className="profile-field-label">Masked Account Number</div>
                      <div className="profile-field-value">{account?.accountNumberMasked}</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Current Balance</div>
                      <div className="profile-field-value" style={{ color: 'var(--emerald)', fontSize: '18px' }}>
                        {account?.formattedBalance}
                      </div>
                    </div>
                    <div>
                      <div className="profile-field-label">Account Category</div>
                      <div className="profile-field-value">{account?.accountType} Account</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Currency</div>
                      <div className="profile-field-value">INR (₹) - Indian Rupee</div>
                    </div>
                    <div>
                      <div className="profile-field-label">IFSC Code (Simulated)</div>
                      <div className="profile-field-value">FORT0004512</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Branch</div>
                      <div className="profile-field-value">Fortis Central Digital Banking</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="section-container">
                  <div className="section-header">
                    <h2 className="section-title">Security & User Profile</h2>
                  </div>
                  <div className="profile-card">
                    <div>
                      <div className="profile-field-label">Full Name</div>
                      <div className="profile-field-value">{user?.name}</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Registered Email</div>
                      <div className="profile-field-value">{user?.email}</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Mobile Number</div>
                      <div className="profile-field-value">+91 {user?.mobile}</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Authentication Method</div>
                      <div className="profile-field-value">Two-Factor Authentication (OTP)</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Password Protection</div>
                      <div className="profile-field-value">Bcrypt Salted & Hashed (Cost 12)</div>
                    </div>
                    <div>
                      <div className="profile-field-label">Session Token</div>
                      <div className="profile-field-value">JSON Web Token (Signed & Blacklistable)</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSimulate={handleSimulateTransaction}
      />
    </div>
  );
}
