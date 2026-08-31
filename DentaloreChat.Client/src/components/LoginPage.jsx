import React, { useState } from 'react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5123/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const user = await response.json();
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-app)' }}>
      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', width: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ color: 'var(--text-main)', textAlign: 'center', marginBottom: '24px' }}>Dentalore Login</h2>
        
        {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '12px', marginBottom: '6px' }}>Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              placeholder="e.g. hana@clinic.com"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '12px', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
