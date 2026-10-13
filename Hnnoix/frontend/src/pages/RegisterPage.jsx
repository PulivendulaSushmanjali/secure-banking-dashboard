import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Phone, Lock, Eye, EyeOff, Check, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AlertNotification } from '../components/AlertNotification';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password criteria verification
  const password = formData.password;
  const passwordCriteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const isMatch = formData.password && formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not fulfill all required security criteria.');
      return;
    }

    if (!isMatch) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await register(formData);
      setSuccessMsg(res.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="bank-brand">
            <span className="brand-badge">
              <Shield size={20} />
            </span>
            <span>FORTIS VAULT</span>
          </div>
          <h1 className="auth-title">Open Online Account</h1>
          <p className="auth-subtitle">Register for secure internet banking with two-factor authentication</p>
        </div>

        <AlertNotification type="error" message={error} onClose={() => setError('')} />
        <AlertNotification type="success" message={successMsg} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
                className="form-input has-left-icon"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div className="input-container">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="aarav@example.com"
                  className="form-input has-left-icon"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mobile">
                Mobile Number
              </label>
              <div className="input-container">
                <Phone size={18} className="input-icon" />
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="form-input has-left-icon"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Account Password
            </label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters"
                className="form-input has-left-icon has-right-icon"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {formData.password && (
              <div className="password-requirements">
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Security criteria:</span>
                <ul>
                  <li className={passwordCriteria.length ? 'valid' : ''}>
                    {passwordCriteria.length ? <Check size={12} /> : <X size={12} />} Minimum 8 characters
                  </li>
                  <li className={passwordCriteria.upper ? 'valid' : ''}>
                    {passwordCriteria.upper ? <Check size={12} /> : <X size={12} />} At least one uppercase letter (A-Z)
                  </li>
                  <li className={passwordCriteria.lower ? 'valid' : ''}>
                    {passwordCriteria.lower ? <Check size={12} /> : <X size={12} />} At least one lowercase letter (a-z)
                  </li>
                  <li className={passwordCriteria.number ? 'valid' : ''}>
                    {passwordCriteria.number ? <Check size={12} /> : <X size={12} />} At least one number (0-9)
                  </li>
                  <li className={passwordCriteria.special ? 'valid' : ''}>
                    {passwordCriteria.special ? <Check size={12} /> : <X size={12} />} At least one special symbol (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="form-input has-left-icon has-right-icon"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword && (
              <div style={{ marginTop: '5px', fontSize: '12px', color: isMatch ? 'var(--emerald)' : 'var(--rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isMatch ? <Check size={14} /> : <X size={14} />}
                {isMatch ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '14px' }}
          >
            {loading ? 'Creating Secure Account...' : 'Complete Registration'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>

        <div className="security-guarantee-badge">
          <Shield size={16} />
          <span>All customer credentials encrypted using industry-standard bcrypt</span>
        </div>
      </div>
    </div>
  );
}
