import React from 'react';
import { ClipLoader } from 'react-spinners';

const Loader = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <ClipLoader color="#0288d1" size={50} />
    </div>
  );
};

export default Loader;