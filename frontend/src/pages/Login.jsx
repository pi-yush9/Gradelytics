import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('educator@gradelytics.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Logo size={42} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#172554', letterSpacing: '-0.02em' }}>
            Educator Sign In
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
            Predict Better. Perform Better.
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Academic Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="e.g. educator@gradelytics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', height: '44px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={fillDemoAccount}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
            >
              <ShieldCheck size={14} />
              <span>Use Demo Evaluator Credentials</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748B' }}>
          Don't have an educator account?{' '}
          <Link to="/register" style={{ color: '#2563EB', fontWeight: 600 }}>
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
