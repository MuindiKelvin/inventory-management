import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { auth, db } from '../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ProductForm = ({ addProduct }) => {
  const [product, setProduct] = useState({
    name: '',
    barcode: '',
    price: '',
    quantity: '',
    total: '',
    sellingPrice: '',
    sold: '',
    balance: '',
    date: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState(0);
  const [stock, setStock] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Get logged-in user
    setUser(auth.currentUser);

    // Calculate total sales and stock
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => doc.data());
      const totalSales = products.reduce((sum, p) => sum + (parseInt(p.sold) * parseInt(p.sellingPrice)), 0);
      const totalStock = products.reduce((sum, p) => sum + parseInt(p.balance), 0);
      setSales(totalSales);
      setStock(totalStock);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addProduct(product);
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <Card className="p-4 mb-4 shadow">
      <Row>
        <Col xs={12} md={6}>
          <h4>Add New Product</h4>
        </Col>
        <Col xs={12} md={6} className="text-md-end mb-3">
          <p className="mb-0"><strong>User:</strong> {user ? user.email : 'Loading...'}</p>
          <p className="mb-0"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p className="mb-0"><strong>Sales (Ksh):</strong> {sales.toLocaleString()}</p>
        </Col>
      </Row>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control type="text" name="name" onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Barcode/QR</Form.Label>
              <Form.Control type="text" name="barcode" onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Price/Item (Ksh)</Form.Label>
              <Form.Control type="number" name="price" onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control type="number" name="quantity" onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Total</Form.Label>
              <Form.Control type="number" name="total" onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Selling Price (Ksh)</Form.Label>
              <Form.Control type="number" name="sellingPrice" onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Sold</Form.Label>
              <Form.Control type="number" name="sold" onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Balance Stock</Form.Label>
              <Form.Control type="number" name="balance" onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6}>
            <Button variant="primary" type="submit">
              Add Product
            </Button>
          </Col>
          <Col xs={12} md={6} className="text-md-end mt-3 mt-md-0">
            <p className="mb-0"><strong>Available Stock:</strong> {stock}</p>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default ProductForm;