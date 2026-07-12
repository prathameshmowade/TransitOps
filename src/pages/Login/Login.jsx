import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (failedAttempts >= 4) {
      setError('Invalid credentials. Account locked after 5 failed attempts.');
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password.');
      setFailedAttempts(prev => prev + 1);
      return;
    }

    // Mock successful login
    setError('');
    onLogin({ email, role });
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left">
        <div>
          <div className="login-brand">
            <div className="login-logo-container">
              <div className="login-logo-icon"></div>
              <h1 className="login-title">TransitOps</h1>
            </div>
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
        </div>

        <div className="login-footer">
          TRANSITOPS © 2026 - RBAC DEMO
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-subtitle">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">✗</span>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                className="form-input" 
                placeholder="raven.k@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Role (Mock)</label>
              <select 
                id="role" 
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="btn-primary">Sign In</button>

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
