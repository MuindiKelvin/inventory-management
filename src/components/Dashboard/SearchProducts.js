import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col } from 'react-bootstrap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import ProductTable from './ProductTable';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners'; // Add this import

const SearchProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
      setFilteredProducts(productList);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    const filtered = products.filter(
      product =>
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.barcode.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <ClipLoader color="#0288d1" size={50} />
    </div>;
  }

  return (
    <Container fluid className="p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Search Products</h2>
        <Row className="mb-3">
          <Col xs={12} md={6}>
            <Form.Control
              type="text"
              placeholder="Search by product name or barcode..."
              value={searchTerm}
              onChange={handleSearch}
              id="search-products-page-search"
            />
          </Col>
        </Row>
        <ProductTable products={filteredProducts} />
      </motion.div>
    </Container>
  );
};

export default SearchProducts;