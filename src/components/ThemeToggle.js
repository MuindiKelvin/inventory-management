import React from 'react';
import { Button } from 'react-bootstrap';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';

const ThemeToggle = ({ toggleTheme, currentTheme }) => {
  return (
    <Button
      variant="outline-secondary"
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1001,
        borderRadius: '50%',
        padding: '10px',
      }}
    >
      {currentTheme === 'winter-theme' ? <BsMoonFill /> : <BsSunFill />}
    </Button>
  );
};

export default ThemeToggle;