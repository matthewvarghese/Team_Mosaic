import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'access_denied':
          setError('Google sign-in was cancelled');
          break;
        case 'auth_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'no_token':
          setError('No authentication token received');
          break;
        default:
          setError('An error occurred during sign-in');
      }
    }
  }, [searchParams]);

  const handleDummySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%',
        padding: '40px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          marginBottom: '30px', 
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          TeamMosaic Login
        </h1>
        
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#357ae8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4285f4'}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ 
          textAlign: 'center', 
          margin: '20px 0',
          color: '#666',
          fontSize: '14px',
          position: 'relative'
        }}>
          <span style={{
            backgroundColor: 'white',
            padding: '0 10px',
            position: 'relative',
            zIndex: 1
          }}>
            OR
          </span>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#ddd',
            zIndex: 0
          }} />
        </div>

        <form onSubmit={handleDummySubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Email (Demo Mode):
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#d32f2f', 
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              fontSize: '14px',
              border: '1px solid #ef9a9a'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In (Demo)'}
          </button>
        </form>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#666',
          textAlign: 'center'
        }}>
          Demo 
        </p>
      </div>
    </div>
  );
};