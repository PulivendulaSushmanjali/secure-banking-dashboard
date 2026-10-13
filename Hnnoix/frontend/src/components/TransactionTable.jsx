import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, FileText } from 'lucide-react';

export function TransactionTable({ transactions = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filter === 'ALL' || tx.type === filter;
    const matchesSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.formattedDate.includes(search) ||
      String(tx.amount).includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Transactions</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Showing {filtered.length} of {transactions.length} recorded operations
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-container" style={{ width: '220px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input has-left-icon"
              style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
            />
          </div>

          <div className="table-filter-group">
            <button
              onClick={() => setFilter('ALL')}
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('CREDIT')}
              className={`filter-btn ${filter === 'CREDIT' ? 'active' : ''}`}
            >
              Credits
            </button>
            <button
              onClick={() => setFilter('DEBIT')}
              className={`filter-btn ${filter === 'DEBIT' ? 'active' : ''}`}
            >
              Debits
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="banking-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <FileText size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                  No transactions match your current filters.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)', width: '130px' }}>
                    {tx.formattedDate}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</div>
                  </td>
                  <td style={{ width: '120px' }}>
                    <span className={`badge ${tx.type === 'CREDIT' ? 'badge-credit' : 'badge-debit'}`}>
                      {tx.type === 'CREDIT' ? (
                        <>
                          <ArrowDownLeft size={13} /> CREDIT
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={13} /> DEBIT
                        </>
                      )}
                    </span>
                  </td>
                  <td
                    style={{ textAlign: 'right', width: '150px' }}
                    className={`amount-cell ${tx.type === 'CREDIT' ? 'amount-credit' : 'amount-debit'}`}
                  >
                    {tx.formattedAmount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
