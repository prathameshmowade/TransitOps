import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, hasErrors } from '../../utils/validators';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError('');

    // Validate
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
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-subtitle">Enter your credentials to continue</p>
          </div>

          {serverError && (
            <div className="alert alert-error">
              <span>✗</span> {serverError}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="fleet@transitops.in"
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

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary login-submit">Sign In</button>

            <div className="access-scope-info">
              <p>Access is scoped by role after login:</p>
              <ul className="access-scope-list">
                <li>• Fleet Manager → Fleet, Maintenance</li>
                <li>• Dispatcher → Dashboard, Trips</li>
                <li>• Safety Officer → Drivers, Compliance</li>
                <li>• Financial Analyst → Fuel & Expenses, Analytics</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
