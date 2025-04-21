import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Table, Badge, InputGroup, Modal, Image, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { collection, getDocs, updateDoc, doc, addDoc, increment, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaSearch, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCreditCard, FaMobile, FaMoneyBill, FaReceipt, FaTimes, FaCheck } from 'react-icons/fa';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [transactionCode, setTransactionCode] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoryList = querySnapshot.docs.map(doc => doc.data().name);
      setCategories(categoryList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories: ' + error.message);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product => product.balance > 0); // Only show products with available stock
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Check if adding one more would exceed available balance
      if (existingItem.quantity >= product.balance) {
        toast.warning(`Cannot add more ${product.name}. Maximum stock reached.`);
        return;
      }
      
      const updatedCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sellingPrice } 
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        sellingPrice: product.sellingPrice, 
        quantity: 1, 
        imageUrl: product.imageUrl,
        total: product.sellingPrice,
        maxQuantity: product.balance
      }]);
    }
    
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    const product = cart.find(item => item.id === productId);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (newQuantity > product.maxQuantity) {
      toast.warning(`Cannot add more than available stock (${product.maxQuantity}).`);
      return;
    }
    
    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.sellingPrice } 
        : item
    );
    
    setCart(updatedCart);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }
    
    setShowCheckoutModal(true);
  };

  const validatePaymentInfo = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return false;
    }
    
    if (!customerInfo.name.trim()) {
      toast.error("Please enter customer name");
      return false;
    }
    
    if (paymentMethod === 'mpesa' && !transactionCode.trim()) {
      toast.error("Please enter M-Pesa transaction code");
      return false;
    }
    
    return true;
  };

  const completeTransaction = async () => {
    if (!validatePaymentInfo()) return;
    
    setProcessingPayment(true);
    
    try {
      // 1. Create a new sale record
      const saleData = {
        products: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          total: item.total
        })),
        customer: customerInfo,
        paymentMethod,
        transactionCode: transactionCode || "N/A",
        total: getCartTotal(),
        timestamp: new Date(),
        status: paymentMethod === 'credit' ? 'pending' : 'completed'
      };
      
      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      
      // 2. Update product inventory
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          sold: increment(item.quantity),
          balance: increment(-item.quantity)
        });
      }
      
      // 3. Generate receipt
      const receipt = {
        receiptNumber: `INV-${Date.now().toString().substring(6)}`,
        date: new Date().toLocaleString(),
        items: cart,
        customer: customerInfo,
        paymentMethod,
        transactionCode: transactionCode || "N/A",
        total: getCartTotal(),
        saleId: saleRef.id
      };
      
      setReceiptData(receipt);
      
      // 4. Close checkout modal and show receipt
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
      
      // 5. Reset cart
      setCart([]);
      setPaymentMethod('');
      setTransactionCode('');
      
      toast.success("Transaction completed successfully!");
      
      // 6. Refresh products list to update stock
      fetchProducts();
    } catch (error) {
      console.error("Error completing transaction:", error);
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
              <FaShoppingCart className="me-2 text-primary" /> Sales
            </h2>
          </Col>
        </Row>
        
        <Row>
          {/* Product Selection Section */}
          <Col xs={12} lg={8} className="mb-4">
            <Card className="shadow border-0" style={{ background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)' }}>
              <Card.Header className="bg-transparent border-0">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0">Available Products</h5>
                  </Col>
                  <Col xs="auto">
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search products or scan barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Filter by Category</Form.Label>
                      <Form.Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {categories.map((category, idx) => (
                          <option key={idx} value={category}>{category}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Row xs={1} md={2} lg={3} className="g-3">
                    <AnimatePresence>
                      {filteredProducts.map(product => (
                        <Col key={product.id}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="h-100 product-card shadow-sm">
                              <div className="text-center p-2" style={{ height: '140px', overflow: 'hidden' }}>
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <div className="placeholder-image d-flex align-items-center justify-content-center h-100 bg-light">
                                    <FaShoppingCart size={40} className="text-muted" />
                                  </div>
                                )}
                              </div>
                              <Card.Body className="d-flex flex-column">
                                <Card.Title className="text-truncate">{product.name}</Card.Title>
                                <Badge bg="info" className="mb-2 align-self-start">
                                  {product.category || 'Uncategorized'}
                                </Badge>
                                <p className="text-muted small mb-2">
                                  {product.description ? 
                                    (product.description.length > 60 ? 
                                      `${product.description.substring(0, 60)}...` : 
                                      product.description) : 
                                    'No description available'}
                                </p>
                                <div className="mt-auto">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold">Ksh {product.sellingPrice?.toLocaleString()}</span>
                                    <Badge bg={product.balance < 10 ? 'warning' : 'success'}>
                                      Stock: {product.balance}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="primary"
                                    className="w-100"
                                    onClick={() => addToCart(product)}
                                    disabled={product.balance <= 0}
                                  >
                                    <FaPlus className="me-2" /> Add to Cart
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </motion.div>
                        </Col>
                      ))}
                    </AnimatePresence>
                    
                    {filteredProducts.length === 0 && !loading && (
                      <Col xs={12} className="text-center py-5">
                        <p className="text-muted">No products found matching your search.</p>
                      </Col>
                    )}
                    
                    {loading && (
                      <Col xs={12} className="text-center py-5">
                        <p>Loading products...</p>
                      </Col>
                    )}
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Shopping Cart Section */}
          <Col xs={12} lg={4}>
            <Card className="shadow border-0" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
              <Card.Header className="bg-transparent border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaShoppingCart className="me-2" /> Shopping Cart
                </h5>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {cart.length > 0 ? (
                  <AnimatePresence>
                    {cart.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="mb-3"
                      >
                        <Card className="shadow-sm">
                          <Card.Body className="py-2">
                            <Row className="align-items-center">
                              <Col xs={8}>
                                <div className="d-flex align-items-center">
                                  {item.imageUrl && (
                                    <Image
                                      src={item.imageUrl}
                                      roundedCircle
                                      width={30}
                                      height={30}
                                      className="me-2"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  )}
                                  <div>
                                    <div className="fw-bold text-truncate" style={{ maxWidth: '150px' }}>
                                      {item.name}
                                    </div>
                                    <div className="small">Ksh {item.sellingPrice} x {item.quantity}</div>
                                  </div>
                                </div>
                              </Col>
                              <Col xs={4} className="text-end">
                                <div className="fw-bold mb-1">Ksh {item.total}</div>
                                <div className="btn-group btn-group-sm">
                                  <Button
                                    variant="outline-secondary"
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    <FaMinus size={10} />
                                  </Button>
                                  <Button variant="outline-secondary" disabled>
                                    {item.quantity}
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.maxQuantity}
                                  >
                                    <FaPlus size={10} />
                                  </Button>
                                </div>
                              </Col>
                              <Col xs={12} className="text-end mt-1">
                                <Button
                                  variant="link"
                                  className="text-danger p-0"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <FaTrash size={14} /> Remove
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-5">
                    <FaShoppingCart size={40} className="text-muted mb-3" />
                    <p className="text-muted">Your cart is empty</p>
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="bg-transparent">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold">Total</span>
                  <span className="fs-4 fw-bold">Ksh {getCartTotal().toLocaleString()}</span>
                </div>
                <Button
                  variant="success"
                  className="w-100"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  <FaReceipt className="me-2" /> Checkout
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </motion.div>

      {/* Checkout Modal */}
      <Modal show={showCheckoutModal} onHide={() => setShowCheckoutModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Complete Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <h5>Order Summary</h5>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>Ksh {item.sellingPrice.toLocaleString()}</td>
                      <td>Ksh {item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3}>Total</th>
                    <th>Ksh {getCartTotal().toLocaleString()}</th>
                  </tr>
                </tfoot>
              </Table>
            </Col>
            <Col md={6}>
              <h5>Customer & Payment Information</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number (Optional)</Form.Label>
                  <Form.Control
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email (Optional)</Form.Label>
                  <Form.Control
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </Form.Group>
                
                <h6>Payment Method</h6>
                <div className="d-flex gap-2 mb-3">
                  <OverlayTrigger placement="top" overlay={<Tooltip>Cash Payment</Tooltip>}>
                    <Button
                      variant={paymentMethod === 'cash' ? 'primary' : 'outline-primary'}
                      onClick={() => setPaymentMethod('cash')}
                      className="d-flex flex-column align-items-center p-3"
                    >
                      <FaMoneyBill size={24} />
                      <span className="mt-2">Cash</span>
                    </Button>
                  </OverlayTrigger>
                  
                  <OverlayTrigger placement="top" overlay={<Tooltip>M-Pesa Payment</Tooltip>}>
                    <Button
                      variant={paymentMethod === 'mpesa' ? 'primary' : 'outline-primary'}
                      onClick={() => setPaymentMethod('mpesa')}
                      className="d-flex flex-column align-items-center p-3"
                    >
                      <FaMobile size={24} />
                      <span className="mt-2">M-Pesa</span>
                    </Button>
                  </OverlayTrigger>
                  
                  <OverlayTrigger placement="top" overlay={<Tooltip>Credit/Card Payment</Tooltip>}>
                    <Button
                      variant={paymentMethod === 'credit' ? 'primary' : 'outline-primary'}
                      onClick={() => setPaymentMethod('credit')}
                      className="d-flex flex-column align-items-center p-3"
                    >
                      <FaCreditCard size={24} />
                      <span className="mt-2">Credit</span>
                    </Button>
                  </OverlayTrigger>
                </div>
                
                {paymentMethod === 'mpesa' && (
                  <Form.Group className="mb-3">
                    <Form.Label>M-Pesa Transaction Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={transactionCode}
                      onChange={(e) => setTransactionCode(e.target.value)}
                      placeholder="Enter M-Pesa transaction code"
                      required
                    />
                  </Form.Group>
                )}
              </Form>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCheckoutModal(false)}>
            <FaTimes className="me-1" /> Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={completeTransaction}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <>Processing...</>
            ) : (
              <>
                <FaCheck className="me-1" /> Complete Purchase
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Receipt Modal */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Purchase Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {receiptData && (
            <div className="p-3 border">
              <div className="text-center mb-3">
                <h4>SABREHAWK STORES</h4>
                <p className="mb-1">123 Business Street</p>
                <p className="mb-1">Nairobi, Kenya</p>
                <p className="mb-3">Tel: +254 724 864 985</p>
                <h5>RECEIPT</h5>
                <p className="mb-0">Receipt #: {receiptData.receiptNumber}</p>
                <p>Date: {receiptData.date}</p>
              </div>
              
              <div className="mb-3">
                <p className="mb-1"><strong>Customer:</strong> {receiptData.customer.name}</p>
                {receiptData.customer.phone && <p className="mb-1"><strong>Phone:</strong> {receiptData.customer.phone}</p>}
                {receiptData.customer.email && <p className="mb-1"><strong>Email:</strong> {receiptData.customer.email}</p>}
              </div>
              
              <Table bordered size="sm" className="mb-3">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>Ksh {item.sellingPrice.toLocaleString()}</td>
                      <td>Ksh {item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3}>Total</th>
                    <th>Ksh {receiptData.total.toLocaleString()}</th>
                  </tr>
                </tfoot>
              </Table>
              
              <div className="mb-3">
                <p className="mb-1"><strong>Payment Method:</strong> {
                  receiptData.paymentMethod === 'cash' ? 'Cash' : 
                  receiptData.paymentMethod === 'mpesa' ? 'M-Pesa' : 
                  'Credit/Card'
                }</p>
                {receiptData.paymentMethod === 'mpesa' && (
                  <p className="mb-1"><strong>Transaction Code:</strong> {receiptData.transactionCode}</p>
                )}
                <p className="mb-1"><strong>Status:</strong> {
                  receiptData.paymentMethod === 'credit' ? 
                    <Badge bg="warning">Pending</Badge> : 
                    <Badge bg="success">Paid</Badge>
                }</p>
              </div>
              
              <div className="text-center mt-4">
                <p className="mb-1">Thank you for your business!</p>
                <p className="small">For returns or exchanges, please present this receipt within 7 days.</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            Print Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Sales;