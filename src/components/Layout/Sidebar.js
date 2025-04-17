import React from 'react';
import { Nav, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebaseConfig';
import { BsHouseDoor, BsPlusSquare, BsSearch, BsPrinter, BsBoxArrowLeft, BsPalette } from 'react-icons/bs';
import { motion } from 'framer-motion';

const Sidebar = ({ toggleTheme, theme }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const handleThemeChange = (e) => {
    toggleTheme(e.target.value);
  };

  const linkVariants = {
    hover: { scale: 1.1, transition: { duration: 0.3 } },
    tap: { scale: 0.9 },
  };

  return (
    <div className="bg-dark text-white p-3" style={{ width: '250px', minHeight: '100vh', position: 'relative', zIndex: 1000 }}>
      <motion.h4
        className="text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Inventory System
      </motion.h4>
      <Nav className="flex-column">
        <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
          <Nav.Link
            href="/dashboard"
            className="text-white d-flex align-items-center mb-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
          >
            <BsHouseDoor className="me-2" /> Dashboard
          </Nav.Link>
        </motion.div>
        <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
          <Nav.Link
            href="/add-product"
            className="text-white d-flex align-items-center mb-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/add-product');
            }}
          >
            <BsPlusSquare className="me-2" /> Add Product
          </Nav.Link>
        </motion.div>
        <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
          <Nav.Link
            href="/search-products"
            className="text-white d-flex align-items-center mb-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/search-products');
            }}
          >
            <BsSearch className="me-2" /> Search Products
          </Nav.Link>
        </motion.div>
        <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
          <Nav.Link
            href="/print-receipts"
            className="text-white d-flex align-items-center mb-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/print-receipts');
            }}
          >
            <BsPrinter className="me-2" /> Print Receipts
          </Nav.Link>
        </motion.div>
        <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
          <div className="d-flex align-items-center mb-2">
            <BsPalette className="me-2 text-white" />
            <Form.Select
              value={theme}
              onChange={handleThemeChange}
              className="bg-dark text-white border-0"
              style={{ width: 'auto', backgroundImage: 'none' }}
            >
              <option value="winter">Winter Theme</option>
              <option value="dark">Dark Theme</option>
            </Form.Select>
          </div>
        </motion.div>
        <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
          <Nav.Link
            onClick={handleLogout}
            className="text-white d-flex align-items-center mt-4"
          >
            <BsBoxArrowLeft className="me-2" /> Logout
          </Nav.Link>
        </motion.div>
      </Nav>
    </div>
  );
};

export default Sidebar;