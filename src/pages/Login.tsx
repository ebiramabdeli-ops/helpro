import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

// Phase 5: Authentication (Only When Needed)

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'magic'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const bookingData = (location.state as any)?.bookingData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle authentication
    // After successful login, navigate to order confirmation
    if (bookingData) {
      navigate('/booking/confirm', { state: bookingData });
    } else {
      navigate('/dashboard');
    }
  };

  const handleMagicLink = () => {
    // Send magic link to email
    alert('Magic link sent to your email. Check your inbox.');
  };

  return (
    <div className="page" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Sign In</h1>
      {bookingData && (
        <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong>Why login?</strong> To confirm your booking and receive updates about your service.
          </p>
        </div>
      )}

      <Card>
        {/* Login Method Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setLoginMethod('email')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: loginMethod === 'email' ? '2px solid var(--primary)' : 'none',
              fontWeight: loginMethod === 'email' ? 600 : 400,
              color: loginMethod === 'email' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: loginMethod === 'phone' ? '2px solid var(--primary)' : 'none',
              fontWeight: loginMethod === 'phone' ? 600 : 400,
              color: loginMethod === 'phone' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Phone
          </button>
          <button
            onClick={() => setLoginMethod('magic')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: loginMethod === 'magic' ? '2px solid var(--primary)' : 'none',
              fontWeight: loginMethod === 'magic' ? 600 : 400,
              color: loginMethod === 'magic' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Magic Link
          </button>
        </div>

        {/* Email Login */}
        {loginMethod === 'email' && (
          <form className="page__form" onSubmit={handleSubmit}>
            <label>
              Email Address
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit">Sign In</Button>
            <NavLink to="/forgot" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
              Forgot password?
            </NavLink>
          </form>
        )}

        {/* Phone Login */}
        {loginMethod === 'phone' && (
          <form className="page__form" onSubmit={handleSubmit}>
            <label>
              Phone Number
              <Input
                type="tel"
                required
                placeholder="+49 xxx xxx xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
              We will send you a verification code via SMS.
            </p>
            <Button type="submit">Send Code</Button>
          </form>
        )}

        {/* Magic Link */}
        {loginMethod === 'magic' && (
          <div className="page__form">
            <label>
              Email Address
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
              We will send you a secure login link. No password needed.
            </p>
            <Button type="button" onClick={handleMagicLink}>Send Magic Link</Button>
          </div>
        )}

        {/* Divider */}
        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)' }} />
          <span style={{ position: 'relative', background: 'var(--background)', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            or
          </span>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Do not have an account?
          </p>
          <NavLink
            to="/register"
            state={location.state}
            style={{ color: 'var(--primary)', fontWeight: 500 }}
          >
            Create an account
          </NavLink>
        </div>
      </Card>

      {/* Privacy Notice */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
          We will never share your data without your consent.
        </p>
      </div>
    </div>
  );
}
