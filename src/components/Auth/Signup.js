import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { Container, Form, Button, Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { BsLockFill, BsEnvelopeFill, BsShieldCheck, BsCheck2Circle, BsArrowRepeat, BsPersonPlusFill } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Signup = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength < 50) return 'danger';
    if (strength < 75) return 'warning';
    return 'success';
  };

  const getStrengthText = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    if (strength < 100) return 'Strong';
    return 'Very Strong';
  };

  const passwordStrength = checkPasswordStrength(password);
  const strengthColor = getStrengthColor(passwordStrength);
  const strengthText = getStrengthText(passwordStrength);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    
    if (passwordStrength < 50) {
      toast.warning('Your password is weak. Consider using a stronger password.', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
    
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check and try again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
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

  return (
    <div className="auth-bg">
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Row className="w-100">
          <Col xs={12} md={6} lg={4} className="mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-4 shadow-lg auth-card glass-card border-0">
                <motion.div 
                  className="text-center mb-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mb-3">
                    <motion.div 
                      className="bg-primary rounded-circle d-inline-flex justify-content-center align-items-center"
                      style={{ width: '70px', height: '70px' }}
                      whileHover={{ rotate: 10, scale: 1.05 }}
                    >
                      <BsPersonPlusFill className="text-white" size={35} />
                    </motion.div>
                  </div>
                  <h2 className="text-gradient">Create Account</h2>
                  <p className="text-muted">Join us to manage your inventory efficiently</p>
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Form onSubmit={handleSignup}>
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

                    {password && (
                      <motion.div 
                        variants={itemVariants}
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small>Password Strength</small>
                          <small className={`text-${strengthColor}`}>{strengthText}</small>
                        </div>
                        <ProgressBar 
                          now={passwordStrength} 
                          variant={strengthColor} 
                          className="mb-2" 
                          style={{ height: '6px' }}
                        />
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {password.length >= 8 ? (
                            <span className="badge bg-success">8+ chars</span>
                          ) : (
                            <span className="badge bg-secondary">8+ chars</span>
                          )}
                          {/[A-Z]/.test(password) ? (
                            <span className="badge bg-success">Uppercase</span>
                          ) : (
                            <span className="badge bg-secondary">Uppercase</span>
                          )}
                          {/[0-9]/.test(password) ? (
                            <span className="badge bg-success">Number</span>
                          ) : (
                            <span className="badge bg-secondary">Number</span>
                          )}
                          {/[^A-Za-z0-9]/.test(password) ? (
                            <span className="badge bg-success">Symbol</span>
                          ) : (
                            <span className="badge bg-secondary">Symbol</span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3 position-relative">
                        <BsShieldCheck className="auth-icon text-primary" />
                        <Form.Control
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="ps-5 py-2 rounded-pill"
                        />
                        {confirmPassword && password === confirmPassword && (
                          <BsCheck2Circle 
                            className="position-absolute end-0 text-success" 
                            style={{ right: '15px', top: '50%', transform: 'translateY(-50%)' }}
                          />
                        )}
                      </Form.Group>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="mt-4"
                    >
                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 btn-gradient rounded-pill py-2 d-flex align-items-center justify-content-center"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <BsArrowRepeat className="spin-animation me-2" />
                            Creating Account...
                          </>
                        ) : (
                          'Sign Up'
                        )}
                      </Button>
                    </motion.div>
                  </Form>

                  <motion.div variants={itemVariants} className="text-center mt-4">
                    <p className="mb-0">
                      Already have an account? <a href="/" className="text-primary fw-bold">Login</a>
                    </p>
                  </motion.div>

                  <motion.div 
                    variants={itemVariants}
                    className="d-flex justify-content-center align-items-center mt-4"
                  >
                    <div className="border-top w-25"></div>
                    <p className="mx-2 text-muted mb-0">or sign up with</p>
                    <div className="border-top w-25"></div>
                  </motion.div>

                  <motion.div 
                    variants={itemVariants}
                    className="d-flex justify-content-center gap-3 mt-3"
                  >
                    {['google', 'facebook', 'apple'].map((provider) => (
                      <motion.button
                        key={provider}
                        className="btn btn-outline-secondary rounded-circle"
                        style={{ width: '45px', height: '45px' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <i className={`bi bi-${provider}`}></i>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>

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

export default Signup;