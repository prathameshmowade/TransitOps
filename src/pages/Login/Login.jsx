import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, hasErrors } from '../../utils/validators';
import './Login.css';

const Login = () => {
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError('');

    if (isSignUp) {
      const fieldErrors = {};
      if (!name.trim()) fieldErrors.name = 'Full Name is required';
      if (!email.trim()) {
        fieldErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        fieldErrors.email = 'Invalid email address';
      }
      if (!password) {
        fieldErrors.password = 'Password is required';
      } else if (password.length < 6) {
        fieldErrors.password = 'Password must be at least 6 characters';
      }
      if (password !== confirmPassword) {
        fieldErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      const result = register(name, email, role, password);
      if (!result.success) {
        setServerError(result.error);
      }
    } else {
      const fieldErrors = {
        ...validateEmail(email),
        ...validatePassword(password),
      };

      if (hasErrors(fieldErrors)) {
        setErrors(fieldErrors);
        return;
      }

      setErrors({});

      if (failedAttempts >= 4) {
        setServerError('Account locked after 5 failed attempts. Please contact your administrator.');
        return;
      }

      const result = login(email, password);
      if (!result.success) {
        setFailedAttempts((prev) => prev + 1);
        setServerError(result.error);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left">
        <div>
          <div className="login-brand">
            <div className="login-logo-icon" />
            <h1 className="login-title">TransitOps</h1>
            <p className="login-subtitle">Smart Transport Operations Platform</p>
          </div>

          {/* 3D Rotating Cube Graphic */}
          <div className="login-3d-scene">
            <div className="login-3d-cube">
              <div className="cube-face front">📦</div>
              <div className="cube-face back">🚛</div>
              <div className="cube-face right">🗺️</div>
              <div className="cube-face left">⛽</div>
              <div className="cube-face top">🔧</div>
              <div className="cube-face bottom">📊</div>
            </div>
          </div>

          <div className="login-roles-info">
            <h2 className="login-roles-title">One login, four roles:</h2>
            <ul className="login-roles-list">
              <li>Fleet Manager</li>
              <li>Dispatcher</li>
              <li>Safety Officer</li>
              <li>Financial Analyst</li>
            </ul>
          </div>

          <div className="login-demo-credentials">
            <p>Demo credentials (any role):</p>
            <code>fleet@transitops.in / admin123</code><br />
            <code>dispatch@transitops.in / admin123</code><br />
            <code>safety@transitops.in / admin123</code><br />
            <code>finance@transitops.in / admin123</code>
          </div>
        </div>

        <div className="login-footer">TRANSITOPS © 2026 — RBAC DEMO</div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2 className="login-form-title">{isSignUp ? 'Create your account' : 'Sign in to your account'}</h2>
            <p className="login-form-subtitle">
              {isSignUp ? 'Fill in details to access TransitOps' : 'Enter your credentials to continue'}
            </p>
          </div>

          {serverError && (
            <div className="alert alert-error">
              <span>✗</span> {serverError}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {isSignUp && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="register-name">Full Name</label>
                  <input
                    type="text"
                    id="register-name"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  />
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-role">System Role</label>
                  <select
                    id="register-role"
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder={isSignUp ? 'yourname@transitops.in' : 'fleet@transitops.in'}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              />
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>

            {isSignUp && (
              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="register-confirm-password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                />
                {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
              </div>
            )}

            {!isSignUp && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
                <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>
            )}

            <button type="submit" className="btn btn-primary login-submit" style={{ marginTop: isSignUp ? '1rem' : '0px' }}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            {/* Toggle Sign Up / Sign In Links */}
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setErrors({}); setServerError(''); }} style={{ fontWeight: 700 }}>
                    Sign In
                  </a>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setErrors({}); setServerError(''); }} style={{ fontWeight: 700 }}>
                    Sign Up
                  </a>
                </>
              )}
            </div>

            <div className="access-scope-info" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Role-Based Access Scope:</p>
              <ul className="access-scope-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>• <strong>Fleet Manager:</strong> Core Asset Registry & Maintenance</li>
                <li>• <strong>Dispatcher:</strong> Trip Schedule Logs & Telemetry Board</li>
                <li>• <strong>Safety Officer:</strong> Driver Compliance & Scorecards</li>
                <li>• <strong>Financial Analyst:</strong> Expense Analytics & Fuel Logs</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
