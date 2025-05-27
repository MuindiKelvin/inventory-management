import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { Container, Form, Button, Card, Row, Col, Modal, Alert } from 'react-bootstrap';
import { BsLockFill, BsEnvelopeFill, BsShieldLockFill, BsArrowRepeat, BsBoxArrowInRight, BsGoogle } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Login = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Initialize Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again or reset your password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else {
        errorMessage += ': ' + error.message;
      }
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      toast.success(`Welcome ${user.displayName || user.email}!`, {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'Google sign-in failed';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += ': ' + error.message;
      }
      
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      toast.info('Password reset email sent! Check your inbox.', {
        position: 'top-right',
        autoClose: 5000,
      });
    } catch (error) {
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check and try again.';
      } else {
        errorMessage += ': ' + error.message;
      }
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
  };

  return (
    <div className="auth-bg">
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Row className="w-100">
          <Col xs={12} md={6} lg={4} className="mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              variants={containerVariants}
            >
              <Card className="p-4 shadow-lg auth-card glass-card border-0">
                <motion.div className="text-center mb-4" variants={itemVariants}>
                  <div className="mb-3">
                    <motion.div 
                      className="bg-primary rounded-circle d-inline-flex justify-content-center align-items-center"
                      style={{ width: '70px', height: '70px' }}
                      whileHover={{ rotate: 10, scale: 1.05 }}
                    >
                      <BsShieldLockFill className="text-white" size={35} />
                    </motion.div>
                  </div>
                  <h2 className="text-gradient">Welcome Back!</h2>
                  <p className="text-muted">Log in to manage your inventory</p>
                </motion.div>

                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  {/* Google Sign-in Button */}
                  <motion.div variants={itemVariants} className="mb-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline-dark"
                        className="w-100 py-2 d-flex align-items-center justify-content-center google-btn"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading || isLoading}
                      >
                        {isGoogleLoading ? (
                          <>
                            <BsArrowRepeat className="spin-animation me-2" />
                            Signing in with Google...
                          </>
                        ) : (
                          <>
                            <BsGoogle className="me-2 text-danger" size={18} />
                            Continue with Google
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Divider */}
                  <motion.div 
                    variants={itemVariants}
                    className="d-flex justify-content-center align-items-center mb-4"
                  >
                    <div className="border-top w-100"></div>
                    <p className="mx-3 text-muted mb-0 small">or</p>
                    <div className="border-top w-100"></div>
                  </motion.div>

                  <Form onSubmit={handleLogin}>
                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3 position-relative">
                        <BsEnvelopeFill className="auth-icon text-primary" />
                        <Form.Control
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="ps-5 py-2 rounded-pill"
                        />
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3 position-relative">
                        <BsLockFill className="auth-icon text-primary" />
                        <Form.Control
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="ps-5 py-2 rounded-pill"
                        />
                      </Form.Group>
                    </motion.div>

                    <motion.div 
                      variants={itemVariants}
                      className="text-end mb-3"
                    >
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none" 
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot Password?
                      </Button>
                    </motion.div>

                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ scale: 1.03 }} 
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 btn-gradient rounded-pill py-2 d-flex align-items-center justify-content-center"
                        disabled={isLoading || isGoogleLoading}
                      >
                        {isLoading ? (
                          <>
                            <BsArrowRepeat className="spin-animation me-2" />
                            Logging in...
                          </>
                        ) : (
                          <>
                            <BsBoxArrowInRight className="me-2" />
                            Login with Email
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </Form>

                  <motion.div variants={itemVariants} className="text-center mt-4">
                    <p className="mb-0">
                      Don't have an account? <a href="/signup" className="text-primary fw-bold">Sign Up</a>
                    </p>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* Forgot Password Modal */}
      <Modal 
        show={showForgotPassword} 
        onHide={closeForgotPassword}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resetSent ? (
            <Alert variant="success">
              <Alert.Heading>Email Sent!</Alert.Heading>
              <p>A password reset link has been sent to <strong>{resetEmail}</strong>. Please check your inbox and follow the instructions to reset your password.</p>
              <hr />
              <p className="mb-0">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
            </Alert>
          ) : (
            <Form onSubmit={handleResetPassword}>
              <p>Enter your email address and we'll send you a link to reset your password.</p>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <div className="d-grid">
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeForgotPassword}>
            {resetSent ? 'Close' : 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS for animations */}
      <style jsx>{`
        .text-gradient {
          background: linear-gradient(90deg, #007bff, #6610f2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .btn-gradient {
          background: linear-gradient(45deg, #007bff, #6f42c1);
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
          background: linear-gradient(45deg, #0069d9, #563d7c);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .google-btn {
          border: 2px solid #e0e0e0;
          transition: all 0.3s ease;
          background: white;
          font-weight: 500;
        }
        
        .google-btn:hover {
          border-color: #d0d0d0;
          background: #f8f9fa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
        }
        
        .auth-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
        }
        
        .auth-bg {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;