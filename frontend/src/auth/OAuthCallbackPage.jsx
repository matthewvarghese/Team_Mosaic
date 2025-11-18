import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');
      if (errorParam) {
        console.error('OAuth error:', errorParam);
        navigate('/login?error=' + errorParam);
        return;
      }

      if (!token) {
        console.log('No token found in URL');
        navigate('/login?error=no_token');
        return;
      }

      try {
        console.log('Token received, saving...');
        localStorage.setItem('token', token);
        
        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
          throw new Error('localStorage blocked by browser');
        }
        await setToken(token);
        
        console.log('Login successful, redirecting...');
        navigate('/', { replace: true });
        
      } catch (err) {
        console.error('Error during login:', err);
        setError('Failed to complete login. Please try again or enable cookies.');
        
        localStorage.removeItem('token');
        
        setTimeout(() => {
          navigate('/login?error=storage_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken]);

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#dc2626' }}>Login Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h2>Completing sign in...</h2>
        <p>Please wait while we log you in.</p>
      </div>
    </div>
  );
};