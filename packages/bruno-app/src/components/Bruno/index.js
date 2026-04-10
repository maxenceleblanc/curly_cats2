import React from 'react';
import logo from 'assets/logo_curly_cats.png';

const Bruno = ({ width }) => {
  return <img src={logo} width={width} height={width} alt="Curly CATS" style={{ objectFit: 'contain' }} />;
};

export default Bruno;
