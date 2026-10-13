import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { AlertNotification } from './AlertNotification';

export function Modal({ isOpen, onClose, onSimulate }) {
  const [type, setType] = useState('DEBIT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a transaction description.');
      return;
    }

    try {
      setSubmitting(true);
      await onSimulate({ type, amount: num, description: description.trim() });
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Simulate Banking Transaction</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <AlertNotification type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setType('DEBIT')}
                className={`filter-btn ${type === 'DEBIT' ? 'active' : ''}`}
                style={{ padding: '10px' }}
              >
                Debit (Expense / Transfer)
              </button>
              <button
                type="button"
                onClick={() => setType('CREDIT')}
                className={`filter-btn ${type === 'CREDIT' ? 'active' : ''}`}
                style={{ padding: '10px' }}
              >
                Credit (Deposit / Inflow)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 1500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              placeholder="e.g. Coffee & Snacks or Dividend"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              <Send size={16} />
              {submitting ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
