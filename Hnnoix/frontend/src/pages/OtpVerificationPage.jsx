import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Clock, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';
import { AlertNotification } from '../components/AlertNotification';

export function OtpVerificationPage() {
  const { temp2FAUser, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Expiry timer (5 minutes = 300s)
  const [expiresIn, setExpiresIn] = useState(temp2FAUser?.expiresInSeconds || 300);
  // Cooldown timer (60s)
  const [cooldown, setCooldown] = useState(temp2FAUser?.cooldownSeconds || 60);

  // If no 2FA session is active, redirect to login
  useEffect(() => {
    if (!temp2FAUser) {
      navigate('/login');
    }
  }, [temp2FAUser, navigate]);

  // Expiry countdown timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(otp);
      setSuccessMsg('Identity verified! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setSuccessMsg('');

    try {
      setLoading(true);
      const res = await resendOtp();
      setCooldown(res.cooldownSeconds || 60);
      setExpiresIn(res.expiresInSeconds || 300);
      setOtp('');
      setSuccessMsg('A fresh 6-digit OTP has been dispatched.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="bank-brand">
            <span className="brand-badge" style={{ background: '#059669' }}>
              <KeyRound size={20} />
            </span>
            <span>FORTIS VAULT 2FA</span>
          </div>
          <h1 className="auth-title">Verify Two-Factor Code</h1>
          <p className="auth-subtitle">
            Enter the 6-digit verification code sent to your registered contact
          </p>
        </div>

        {temp2FAUser?.devOtp && (
          <div className="dev-otp-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span><strong>Dev Demo OTP:</strong></span>
            </div>
            <code>{temp2FAUser.devOtp}</code>
          </div>
        )}

        <AlertNotification type="error" message={error} onClose={() => setError('')} />
        <AlertNotification type="success" message={successMsg} />

        <form onSubmit={handleVerify}>
          <OtpInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (val.length === 6) {
                // Auto trigger verification when 6th digit entered
                setError('');
              }
            }}
            disabled={loading || expiresIn === 0}
          />

          <div className="otp-timer-container">
            <div className={`otp-timer ${expiresIn < 60 ? 'urgent' : ''}`}>
              <Clock size={15} />
              <span>Code expires in: {formatTimer(expiresIn)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || otp.length !== 6 || expiresIn === 0}
          >
            {loading ? 'Verifying Code...' : 'Verify & Open Dashboard'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <ArrowLeft size={14} /> Back to Login
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="btn btn-secondary"
            disabled={cooldown > 0 || loading}
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
          </button>
        </div>

        <div className="security-guarantee-badge">
          <Shield size={16} />
          <span>Maximum 3 verification attempts permitted per session</span>
        </div>
      </div>
    </div>
  );
}
