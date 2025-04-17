import React from 'react';
import { Navbar as BSNavbar, Container } from 'react-bootstrap';

const Navbar = () => {
  return (
    <BSNavbar bg="light" expand="lg">
      <Container>
        <BSNavbar.Brand href="/dashboard">Inventory Management</BSNavbar.Brand>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;