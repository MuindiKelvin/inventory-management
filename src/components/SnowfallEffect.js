import React from 'react';
import Snowfall from 'react-snowfall';

const SnowfallEffect = ({ theme }) => {
  return (
    <Snowfall
      snowflakeCount={100}
      speed={[0.5, 1.5]}
      wind={[0, 0.5]}
      color={theme === 'winter' ? '#ffffff' : '#a3bffa'} // White for winter, light blue for dark
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none', // Prevents interference with clicks
      }}
    />
  );
};

export default SnowfallEffect;