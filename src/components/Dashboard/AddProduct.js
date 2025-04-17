import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Table, OverlayTrigger, Tooltip, InputGroup, Badge } from 'react-bootstrap';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaPlus, FaBarcode, FaBox, FaDollarSign, FaCalendar, FaSearch, FaTag, FaEdit, FaTimes, FaShoppingCart } from 'react-icons/fa';

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: '',
    barcode: '',
    price: '',
    quantity: '',
    sellingPrice: '',
    date: new Date().toISOString().split('T')[0],
    sold: 0,
    balance: 0,
    category: '',
  });
  const [existingProducts, setExistingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTotal, setPreviewTotal] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [soldError, setSoldError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExistingProducts(productList);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products: ' + error.message);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update preview total and validate sold field
    if (name === 'price' || name === 'quantity' || name === 'sold') {
      const price = name === 'price' ? parseInt(value) || 0 : parseInt(product.price) || 0;
      const quantity = name === 'quantity' ? parseInt(value) || 0 : parseInt(product.quantity) || 0;
      const sold = name === 'sold' ? parseInt(value) || 0 : parseInt(product.sold) || 0;

      setPreviewTotal(price * quantity);

      // Validate sold against quantity
      if (sold > quantity) {
        setSoldError('Sold units cannot exceed quantity.');
      } else {
        setSoldError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const quantity = parseInt(product.quantity) || 0;
    const sold = parseInt(product.sold) || 0;

    // Final validation before submission
    if (sold > quantity) {
      toast.error('Sold units cannot exceed quantity.', { position: 'top-right', autoClose: 3000 });
      setLoading(false);
      return;
    }

    const total = parseInt(product.price) * quantity;
    const balance = quantity - sold;

    const productData = {
      ...product,
      price: parseInt(product.price) || 0,
      quantity,
      total,
      sellingPrice: parseInt(product.sellingPrice) || 0,
      sold,
      balance,
      category: product.category || 'Uncategorized',
    };

    try {
      if (editMode) {
        const productRef = doc(db, 'products', editProductId);
        await updateDoc(productRef, productData);
        toast.success(
          <div>
            <FaBox className="me-2" /> Product <strong>{product.name}</strong> updated!
          </div>,
          { position: 'top-right', autoClose: 3000 }
        );
        setEditMode(false);
        setEditProductId(null);
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success(
          <div>
            <FaBox className="me-2" /> Product <strong>{product.name}</strong> added!
          </div>,
          { position: 'top-right', autoClose: 3000 }
        );
      }
      // Reset form
      setProduct({
        name: '',
        barcode: '',
        price: '',
        quantity: '',
        sellingPrice: '',
        date: new Date().toISOString().split('T')[0],
        sold: 0,
        balance: 0,
        category: '',
      });
      setPreviewTotal(0);
      setSoldError('');
      // Refresh product list
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExistingProducts(productList);
    } catch (error) {
      toast.error(`Error ${editMode ? 'updating' : 'adding'} product: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prod) => {
    setEditMode(true);
    setEditProductId(prod.id);
    setProduct({
      name: prod.name || '',
      barcode: prod.barcode || '',
      price: prod.price || '',
      quantity: prod.quantity || '',
      sellingPrice: prod.sellingPrice || '',
      date: prod.date || new Date().toISOString().split('T')[0],
      sold: prod.sold || 0,
      balance: prod.balance || 0,
      category: prod.category || '',
    });
    setPreviewTotal((parseInt(prod.price) || 0) * (parseInt(prod.quantity) || 0));
    setSoldError('');
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditProductId(null);
    setProduct({
      name: '',
      barcode: '',
      price: '',
      quantity: '',
      sellingPrice: '',
      date: new Date().toISOString().split('T')[0],
      sold: 0,
      balance: 0,
      category: '',
    });
    setPreviewTotal(0);
    setSoldError('');
  };

  const filteredProducts = existingProducts.filter(prod =>
    prod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prod.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <Row className="align-items-center mb-3">
          <Col>
            <h2 className="d-flex align-items-center">
              <FaPlus className="me-2 text-primary" /> {editMode ? 'Edit Product' : 'Add New Product'}
            </h2>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6} className="mb-4">
            <Card className="p-4 shadow border-0" style={{ background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)' }}>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaTag className="me-2 text-muted" /> Product Name
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="name"
                      value={product.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      required
                      style={{ transition: 'all 0.3s' }}
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaBarcode className="me-2 text-muted" /> Barcode/QR Code
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="barcode"
                    value={product.barcode}
                    onChange={handleChange}
                    placeholder="Enter barcode or QR code"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaTag className="me-2 text-muted" /> Category
                  </Form.Label>
                  <Form.Select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <FaDollarSign className="me-2 text-muted" /> Price per Item (Ksh)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={product.price}
                        onChange={handleChange}
                        placeholder="Enter price"
                        required
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <FaBox className="me-2 text-muted" /> Quantity
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={product.quantity}
                        onChange={handleChange}
                        placeholder="Enter quantity"
                        required
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <FaShoppingCart className="me-2 text-muted" /> Units Sold
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="sold"
                        value={product.sold}
                        onChange={handleChange}
                        placeholder="Enter units sold"
                        required
                        min="0"
                        isInvalid={!!soldError}
                      />
                      <Form.Control.Feedback type="invalid">
                        {soldError}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <FaDollarSign className="me-2 text-muted" /> Selling Price per Item (Ksh)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="sellingPrice"
                        value={product.sellingPrice}
                        onChange={handleChange}
                        placeholder="Enter selling price"
                        required
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaCalendar className="me-2 text-muted" /> Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={product.date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <motion.div
                  className="mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge bg="info" className="p-2 me-2">
                    Estimated Total: Ksh {previewTotal.toLocaleString()}
                  </Badge>
                  <Badge bg="secondary" className="p-2">
                    Balance: {Math.max((parseInt(product.quantity) || 0) - (parseInt(product.sold) || 0), 0)}
                  </Badge>
                </motion.div>
                <div className="d-flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{editMode ? 'Save changes' : 'Add to inventory'}</Tooltip>}
                    >
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || !!soldError}
                        style={{ background: 'linear-gradient(135deg, #0288d1, #0277bd)', border: 'none' }}
                      >
                        {editMode ? <FaEdit className="me-2" /> : <FaPlus className="me-2" />}
                        {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Product' : 'Add Product')}
                      </Button>
                    </OverlayTrigger>
                  </motion.div>
                  {editMode && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <OverlayTrigger placement="top" overlay={<Tooltip>Cancel editing</Tooltip>}>
                        <Button
                          variant="outline-danger"
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          <FaTimes className="me-2" /> Cancel
                        </Button>
                      </OverlayTrigger>
                    </motion.div>
                  )}
                </div>
              </Form>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="p-4 shadow border-0" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
              <h5 className="d-flex align-items-center mb-3">
                <FaBox className="me-2 text-primary" /> Available Stock
              </h5>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search products or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredProducts.length > 0 ? (
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Sold</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredProducts.map((prod, index) => (
                          <motion.tr
                            key={prod.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <td>{prod.name || 'N/A'}</td>
                            <td>
                              <Badge bg={prod.category === 'Electronics' ? 'primary' : prod.category === 'Clothing' ? 'warning' : 'secondary'}>
                                {prod.category || 'Uncategorized'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="info">{prod.sold || 0}</Badge>
                            </td>
                            <td>
                              <Badge bg={prod.balance < 10 ? 'danger' : 'success'}>{prod.balance || 0}</Badge>
                            </td>
                            <td>
                              <OverlayTrigger placement="top" overlay={<Tooltip>Edit this product</Tooltip>}>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEdit(prod)}
                                  disabled={loading}
                                >
                                  <FaEdit />
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">No products found.</p>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </motion.div>
    </Container>
  );
};

export default AddProduct;