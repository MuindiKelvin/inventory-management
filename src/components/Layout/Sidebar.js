import React, { useState } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebaseConfig';
import { 
  BsHouseDoor, 
  BsPlusSquare, 
  BsGear, 
  BsCart, 
  BsBoxArrowLeft, 
  BsMoonFill, 
  BsSunFill,
  BsChevronLeft,
  BsChevronRight
} from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ toggleTheme, theme }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const handleToggleTheme = () => {
    toggleTheme(theme === 'neon-glow' ? 'forest-bloom' : 'neon-glow');
  };

  // Animation variants
  const sidebarVariants = {
    expanded: { width: '250px', transition: { duration: 0.3 } },
    collapsed: { width: '80px', transition: { duration: 0.3 } }
  };

  const textVariants = {
    visible: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.2 } },
    hidden: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  const linkVariants = {
    hover: { 
      scale: 1.05, 
      transition: { duration: 0.2 },
      boxShadow: theme === 'neon-glow' 
        ? '0 0 8px rgba(13, 202, 240, 0.6)' 
        : '0 0 8px rgba(40, 167, 69, 0.4)'
    },
    tap: { scale: 0.95 },
  };

  const iconStyle = {
    fontSize: '1.4rem',
    color: theme === 'neon-glow' ? '#0dcaf0' : '#28a745'
  };

  // Theme-specific styles
  const themeStyles = {
    container: {
      background: theme === 'neon-glow' ? '#1a1a2e' : '#f0f7f0',
      color: theme === 'neon-glow' ? '#f8f9fa' : '#212529',
      borderRight: theme === 'neon-glow' 
        ? '1px solid rgba(13, 202, 240, 0.2)' 
        : '1px solid rgba(40, 167, 69, 0.2)',
      boxShadow: theme === 'neon-glow' 
        ? '2px 0 10px rgba(13, 202, 240, 0.1)' 
        : '2px 0 10px rgba(40, 167, 69, 0.1)',
      height: '100%',
      overflowX: 'hidden'
    },
    title: {
      color: theme === 'neon-glow' ? '#0dcaf0' : '#28a745',
      fontWeight: 'bold',
      textShadow: theme === 'neon-glow' ? '0 0 10px rgba(13, 202, 240, 0.5)' : 'none'
    },
    navLink: {
      color: theme === 'neon-glow' ? '#e0e0e0' : '#444444',
      background: 'transparent',
      borderRadius: '8px',
      margin: '4px 0',
      padding: '10px 15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start'
    },
    activeNavLink: {
      background: theme === 'neon-glow' 
        ? 'rgba(13, 202, 240, 0.15)' 
        : 'rgba(40, 167, 69, 0.15)',
      color: theme === 'neon-glow' ? '#0dcaf0' : '#28a745'
    },
    toggleButton: {
      background: 'transparent',
      border: 'none',
      color: theme === 'neon-glow' ? '#0dcaf0' : '#28a745',
      position: 'absolute',
      right: isCollapsed ? '50%' : '10px',
      top: '10px',
      transform: isCollapsed ? 'translateX(50%)' : 'none',
      zIndex: 10,
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      boxShadow: theme === 'neon-glow' 
        ? '0 0 5px rgba(13, 202, 240, 0.3)' 
        : '0 0 5px rgba(40, 167, 69, 0.2)'
    }
  };

  // Navigation links configuration
  const navLinks = [
    { 
      path: '/dashboard', 
      icon: <BsHouseDoor style={iconStyle} />, 
      text: 'Dashboard' 
    },
    { 
      path: '/add-product', 
      icon: <BsPlusSquare style={iconStyle} />, 
      text: 'Add Product' 
    },
    { 
      path: '/product-management', 
      icon: <BsGear style={iconStyle} />, 
      text: 'Product Management' 
    },
    { 
      path: '/sales', 
      icon: <BsCart style={iconStyle} />, 
      text: 'Sales' 
    }
  ];

  return (
    <motion.div 
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      style={themeStyles.container}
      className="d-flex flex-column p-3 position-relative"
    >
      <Button 
        variant="link" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={themeStyles.toggleButton}
        className="collapse-toggle"
      >
        {isCollapsed ? <BsChevronRight /> : <BsChevronLeft />}
      </Button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.h4 
            className="text-center mb-4 mt-2"
            style={themeStyles.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Inventory System
          </motion.h4>
        )}
      </AnimatePresence>

      <Nav className="flex-column mb-auto">
        {navLinks.map((link, index) => (
          <motion.div
            key={link.path}
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
            className="mb-2"
          >
            <Nav.Link 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(link.path);
              }}
              style={themeStyles.navLink}
              className="d-flex align-items-center"
            >
              <span className="me-3">{link.icon}</span>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    {link.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </Nav.Link>
          </motion.div>
        ))}
      </Nav>
      
      <div className="mt-auto">
        <motion.div
          variants={linkVariants}
          whileHover="hover"
          whileTap="tap"
          className="mb-3"
        >
          <Button
            variant="link"
            onClick={handleToggleTheme}
            className="w-100 d-flex align-items-center justify-content-center"
            style={{
              ...themeStyles.navLink,
              padding: '8px',
              color: theme === 'neon-glow' ? '#0dcaf0' : '#28a745'
            }}
          >
            <motion.div
              animate={{ rotate: theme === 'neon-glow' ? 360 : 0 }}
              transition={{ duration: 0.5 }}
              className="me-2"
            >
              {theme === 'neon-glow' ? <BsMoonFill /> : <BsSunFill />}
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {theme === 'neon-glow' ? 'Neon Mode' : 'Forest Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
        
        <motion.div
          variants={linkVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline-danger"
            onClick={handleLogout}
            className="w-100 d-flex align-items-center justify-content-center"
            style={{
              ...themeStyles.navLink,
              borderColor: theme === 'neon-glow' ? '#ff5b5b' : '#dc3545',
              color: theme === 'neon-glow' ? '#ff5b5b' : '#dc3545'
            }}
          >
            <BsBoxArrowLeft className="me-2" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;