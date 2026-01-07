import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import './Login.css';

const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>;
const TotpIcon = () => <span>🔐</span>;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  
  const [mfaData, setMfaData] = useState(null);
  const [verifyMfaCode, setVerifyMfaCode] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page-body');
    return () => {
      document.body.classList.remove('login-page-body');
    };
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await api.login({ username, password, totpCode });
      if (data.success) {
        if (data.requireMFASetup) {
          await setupMFA();
        } else if (data.requireMFAToken) {
          setShowTotp(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
        if (data.blocked) {
          setError('Your account has been blocked. Please contact support.');
        }
        setTotpCode('');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const setupMFA = async () => {
    try {
      const data = await api.setupMFA(username);
      if (data.success) {
        setMfaData(data);
      } else {
        setError('Failed to setup MFA. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while setting up MFA.');
    }
  };
  
  const verifyMFASetup = async () => {
    setIsLoading(true);
    try {
      const data = await api.login({
        username,
        password,
        totpCode: verifyMfaCode,
      });
      if (data.success) {
        navigate('/dashboard');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError(error.message || 'MFA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <div className="form-group">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={isLoading}
        />
      </div>
      {showTotp && (
        <div className="form-group">
          <input
            type="text"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="6-digit code"
            maxLength="6"
            required
            autoFocus
            disabled={isLoading}
          />
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      <button type="submit" className="login-btn" disabled={isLoading}>
        {isLoading ? 'Logging in...' : (showTotp ? 'Verify Code' : 'Login')}
      </button>
    </form>
  );
  
  const renderMFASetup = () => (
    <div className="mfa-modal">
      <div className="mfa-modal-content">
        <h2>Setup Multi-Factor Authentication</h2>
        <div className="mfa-setup-steps">
          <div className="step">
            <h3>Step 1: Scan QR Code</h3>
            <p>Scan this QR code with your authenticator app.</p>
            <div className="qr-container">
              {mfaData.qrCode && <img src={mfaData.qrCode} alt="MFA QR Code" />}
            </div>
          </div>
          <div className="step">
            <h3>Step 2: Save Backup Codes</h3>
            <p>Store these codes in a safe place.</p>
            <div className="backup-codes">
              {mfaData.backupCodes.map(code => <span key={code} className="backup-code">{code}</span>)}
            </div>
          </div>
          <div className="step">
            <h3>Step 3: Verify Setup</h3>
            <p>Enter the 6-digit code from your app.</p>
            <input
              type="text"
              value={verifyMfaCode}
              onChange={(e) => setVerifyMfaCode(e.target.value)}
              placeholder="000000"
              maxLength="6"
            />
            <button onClick={verifyMFASetup} className="verify-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Complete Setup'}
            </button>
          </div>
          {error && <div className="error-message" style={{marginTop: '1rem'}}>{error}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="shape shape4"></div>
        <div className="shape shape5"></div>
      </div>
      <div className="login-content">
        <div className="welcome-section">
          <h1>MSSP Welcome's you</h1>
          <p>powred by VIRTUAL GALAXY LTD</p>
          <img src="/VG_logo.png" alt="Virtual Galaxy Logo" className="welcome-logo" />
        </div>
        <div className="login-container">
          <div className="login-card">
            <img src="/cybersentinel_logo.jpg" alt="Logo" className="logo" />
            <h1>Log In Here</h1>
            <h4>Welcome Back</h4>
            {renderLoginForm()}
          </div>
        </div>
      </div>
      {mfaData && renderMFASetup()}
    </div>
  );
};

export default Login;
