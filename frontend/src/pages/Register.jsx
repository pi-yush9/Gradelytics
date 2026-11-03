import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please complete all registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setLoading(true);
      await register(fullName, email, password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
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
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Logo size={42} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#172554', letterSpacing: '-0.02em' }}>
            Create Educator Account
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
            Join Gradelytics to track and predict student performance.
          </p>
        </div>

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
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password (min 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748B' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#2563EB', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
