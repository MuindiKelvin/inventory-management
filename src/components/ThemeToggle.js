import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';
import { motion } from 'framer-motion';

const ThemeToggle = ({ toggleTheme, currentTheme }) => {
  // Tooltip for theme name
  const renderTooltip = (props) => (
    <Tooltip id="theme-tooltip" {...props} className={currentTheme === 'neon-glow' ? 'bg-dark text-light' : 'bg-light text-dark'}>
      {currentTheme === 'neon-glow' ? 'Switch to Forest Bloom' : 'Switch to Neon Glow'}
    </Tooltip>
  );

  // Theme-specific Bootstrap variable overrides
  const themeStyles = `
    :root[data-theme="neon-glow"] {
      --bs-body-bg: #212529;
      --bs-body-color: #f8f9fa;
      --bs-primary: #0dcaf0;
      --bs-secondary: #ff00ff;
      --bs-success: #20c997;
      --bs-card-bg: #343a40;
      --bs-btn-bg: #0dcaf0;
      --bs-btn-border-color: #0dcaf0;
    }

    :root[data-theme="forest-bloom"] {
      --bs-body-bg: #f8f9fa;
      --bs-body-color: #212529;
      --bs-primary: #28a745;
      --bs-secondary: #ffc107;
      --bs-success: #28a745;
      --bs-card-bg: #ffffff;
      --bs-btn-bg: #28a745;
      --bs-btn-border-color: #28a745;
    }

    [data-theme="neon-glow"] .btn-outline-primary {
      --bs-btn-color: #0dcaf0;
      --bs-btn-border-color: #0dcaf0;
      --bs-btn-hover-bg: #0dcaf0;
      --bs-btn-hover-border-color: #0dcaf0;
    }

    [data-theme="forest-bloom"] .btn-outline-primary {
      --bs-btn-color: #28a745;
      --bs-btn-border-color: #28a745;
      --bs-btn-hover-bg: #28a745;
      --bs-btn-hover-border-color: #28a745;
    }
  `;

  return (
    <>
      {/* Inject theme styles */}
      <style>{themeStyles}</style>

      <OverlayTrigger
        placement="left"
        delay={{ show: 250, hide: 400 }}
        overlay={renderTooltip}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Button
            variant={currentTheme === 'neon-glow' ? 'outline-info' : 'outline-success'}
            onClick={toggleTheme}
            className="rounded-circle shadow-sm"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1001,
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <motion.div
              animate={{ rotate: currentTheme === 'neon-glow' ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentTheme === 'neon-glow' ? (
                <BsMoonFill size={20} />
              ) : (
                <BsSunFill size={20} />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </OverlayTrigger>
    </>
  );
};

export default ThemeToggle;