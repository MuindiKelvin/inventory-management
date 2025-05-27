import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Table, Badge, InputGroup, Modal, Image, OverlayTrigger, Tooltip, Pagination, Tab, Tabs } from 'react-bootstrap';
import { collection, getDocs, updateDoc, doc, addDoc, increment, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaSearch, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCreditCard, FaMobile, FaMoneyBill, FaReceipt, FaTimes, FaCheck, FaMoneyCheckAlt, FaUser, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

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
  
  // Balance tracking states
  const [customerBalances, setCustomerBalances] = useState([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [partialPayment, setPartialPayment] = useState(0);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [balanceSearchTerm, setBalanceSearchTerm] = useState('');
  const [currentBalancePage, setCurrentBalancePage] = useState(1);
  const [balancesPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [balancePaymentAmount, setBalancePaymentAmount] = useState(0);
  const [balancePaymentMethod, setBalancePaymentMethod] = useState('');
  const [balanceTransactionCode, setBalanceTransactionCode] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomerBalances();
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
        .filter(product => product.balance > 0);
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBalances = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'customerBalances'), orderBy('purchaseDate', 'desc'))
      );
      const balanceList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          purchaseDate: data.purchaseDate && data.purchaseDate.toDate ? data.purchaseDate.toDate() : new Date(),
          lastPaymentDate: data.lastPaymentDate && data.lastPaymentDate.toDate ? data.lastPaymentDate.toDate() : null,
          clearedDate: data.clearedDate && data.clearedDate.toDate ? data.clearedDate.toDate() : null
        };
      });
      setCustomerBalances(balanceList);
    } catch (error) {
      console.error('Error fetching customer balances:', error);
      toast.error('Failed to load customer balances: ' + error.message);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
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

    if (isPartialPayment) {
      if (partialPayment <= 0 || partialPayment >= getCartTotal()) {
        toast.error("Partial payment must be greater than 0 and less than total amount");
        return false;
      }
    }
    
    return true;
  };

  const validateBalancePayment = () => {
    if (!balancePaymentMethod) {
      toast.error("Please select a payment method for balance");
      return false;
    }
    
    if (balancePaymentAmount <= 0 || balancePaymentAmount > selectedBalance?.balanceAmount) {
      toast.error("Payment amount must be greater than 0 and not exceed outstanding balance");
      return false;
    }

    if (balancePaymentMethod === 'mpesa' && !balanceTransactionCode.trim()) {
      toast.error("Please enter M-Pesa transaction code for balance payment");
      return false;
    }
    
    return true;
  };

  const handleBalancePayment = async () => {
    if (!validateBalancePayment()) return;
    
    try {
      setProcessingPayment(true);
      
      const balanceRef = doc(db, 'customerBalances', selectedBalance.id);
      const newPaidAmount = selectedBalance.paidAmount + balancePaymentAmount;
      const newBalanceAmount = selectedBalance.balanceAmount - balancePaymentAmount;
      
      const updateData = {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount === 0 ? 'cleared' : 'pending',
        lastPaymentDate: new Date()
      };
      
      if (newBalanceAmount === 0) {
        updateData.clearedDate = new Date();
      }
      
      await updateDoc(balanceRef, updateData);
      
      // Update sale record
      const saleRef = doc(db, 'sales', selectedBalance.saleId);
      await updateDoc(saleRef, {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount === 0 ? 'completed' : 'partial'
      });
      
      toast.success(`Balance payment of Ksh ${balancePaymentAmount.toLocaleString()} recorded successfully`);
      setShowBalanceModal(false);
      setBalancePaymentAmount(0);
      setBalancePaymentMethod('');
      setBalanceTransactionCode('');
      setSelectedBalance(null);
      fetchCustomerBalances();
    } catch (error) {
      console.error('Error processing balance payment:', error);
      toast.error(`Failed to process payment: ${error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const completeTransaction = async () => {
    if (!validatePaymentInfo()) return;
    
    setProcessingPayment(true);
    
    try {
      const totalAmount = getCartTotal();
      const paidAmount = isPartialPayment ? partialPayment : totalAmount;
      const balanceAmount = totalAmount - paidAmount;
      
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
        total: totalAmount,
        paidAmount: paidAmount,
        balanceAmount: balanceAmount,
        timestamp: new Date(),
        status: paymentMethod === 'credit' ? 'pending' : balanceAmount > 0 ? 'partial' : 'completed'
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

      // 3. If there's a balance, create a customer balance record
      if (balanceAmount > 0) {
        const balanceData = {
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone || '',
          customerEmail: customerInfo.email || '',
          products: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.sellingPrice,
            total: item.total
          })),
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          balanceAmount: balanceAmount,
          purchaseDate: new Date(),
          saleId: saleRef.id,
          status: 'pending',
          lastPaymentDate: new Date()
        };
        
        await addDoc(collection(db, 'customerBalances'), balanceData);
        toast.info(`Balance of Ksh ${balanceAmount.toLocaleString()} recorded for ${customerInfo.name}`);
      }
      
      // 4. Generate receipt
      const receipt = {
        receiptNumber: `INV-${Date.now().toString().substring(6)}`,
        date: new Date().toLocaleString(),
        items: cart,
        customer: customerInfo,
        paymentMethod,
        transactionCode: transactionCode || "N/A",
        total: totalAmount,
        paidAmount: paidAmount,
        balanceAmount: balanceAmount,
        saleId: saleRef.id
      };
      
      setReceiptData(receipt);
      
      // 5. Close checkout modal and show receipt
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
      
      // 6. Reset cart and form
      setCart([]);
      setPaymentMethod('');
      setTransactionCode('');
      setPartialPayment(0);
      setIsPartialPayment(false);
      setCustomerInfo({ name: '', phone: '', email: '' });
      
      toast.success("Transaction completed successfully!");
      
      // 7. Refresh data
      fetchProducts();
      fetchCustomerBalances();
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

  // Filter and paginate customer balances
  const filteredBalances = customerBalances.filter(balance => 
    balance.customerName?.toLowerCase().includes(balanceSearchTerm.toLowerCase()) ||
    balance.customerPhone?.includes(balanceSearchTerm) ||
    balance.products?.some(product => 
      product.name?.toLowerCase().includes(balanceSearchTerm.toLowerCase())
    )
  );

  const indexOfLastBalance = currentBalancePage * balancesPerPage;
  const indexOfFirstBalance = indexOfLastBalance - balancesPerPage;
  const currentBalances = filteredBalances.slice(indexOfFirstBalance, indexOfLastBalance);
  const totalBalancePages = Math.ceil(filteredBalances.length / balancesPerPage);

  const handleBalancePageChange = (pageNumber) => {
    setCurrentBalancePage(pageNumber);
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const openBalancePaymentModal = (balance) => {
    setSelectedBalance(balance);
    setShowBalanceModal(true);
  };

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
              <FaShoppingCart className="me-2 text-primary" /> Sales & Customer Balances
            </h2>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="sales" title={<><FaShoppingCart className="me-2" />Sales</>}>
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
          </Tab>

          <Tab eventKey="balances" title={<><FaMoneyCheckAlt className="me-2" />Customer Balances</>}>
            <Card className="shadow border-0">
              <Card.Header className="bg-transparent border-0">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0 d-flex align-items-center">
                      <FaUser className="me-2" /> Customer Outstanding Balances
                    </h5>
                  </Col>
                  <Col xs="auto">
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search customers or products..."
                        value={balanceSearchTerm}
                        onChange={(e) => setBalanceSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                {currentBalances.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead className="table-dark">
                          <tr>
                            <th><FaCalendarAlt className="me-1" />Purchase Date</th>
                            <th><FaUser className="me-1" />Customer</th>
                            <th>Products</th>
                            <th>Total Amount</th>
                            <th>Paid Amount</th>
                            <th>Balance</th>
                            <th>Last Payment</th>
                            <th>Cleared Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentBalances.map(balance => (
                            <tr key={balance.id}>
                              <td>{formatDate(balance.purchaseDate)}</td>
                              <td>
                                <div>
                                  <div className="fw-bold">{balance.customerName}</div>
                                  {balance.customerPhone && (
                                    <div className="small text-muted">{balance.customerPhone}</div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                                  {balance.products?.map((product, idx) => (
                                    <div key={idx} className="small">
                                      {product.name} (x{product.quantity}) - Ksh {product.total.toLocaleString()}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="fw-bold">Ksh {balance.totalAmount?.toLocaleString()}</td>
                              <td className="text-success">Ksh {balance.paidAmount?.toLocaleString()}</td>
                              <td className="fw-bold text-danger">Ksh {balance.balanceAmount?.toLocaleString()}</td>
                              <td>{formatDate(balance.lastPaymentDate)}</td>
                              <td>{formatDate(balance.clearedDate)}</td>
                              <td>
                                <Badge bg={balance.status === 'pending' ? 'warning' : 'success'}>
                                  {balance.status === 'pending' ? 'Outstanding' : 'Cleared'}
                                </Badge>
                              </td>
                              <td>
                                {balance.status === 'pending' && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openBalancePaymentModal(balance)}
                                  >
                                    <FaMoneyBillWave className="me-1" /> Pay Balance
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalBalancePages > 1 && (
                      <div className="d-flex justify-content-center mt-4">
                        <Pagination>
                          <Pagination.First 
                            onClick={() => handleBalancePageChange(1)}
                            disabled={currentBalancePage === 1}
                          />
                          <Pagination.Prev 
                            onClick={() => handleBalancePageChange(currentBalancePage - 1)}
                            disabled={currentBalancePage === 1}
                          />
                          
                          {Array.from({ length: Math.min(5, totalBalancePages) }, (_, index) => {
                            let pageNumber;
                            if (totalBalancePages <= 5) {
                              pageNumber = index + 1;
                            } else if (currentBalancePage <= 3) {
                              pageNumber = index + 1;
                            } else if (currentBalancePage >= totalBalancePages - 2) {
                              pageNumber = totalBalancePages - 4 + index;
                            } else {
                              pageNumber = currentBalancePage - 2 + index;
                            }
                            
                            return (
                              <Pagination.Item
                                key={pageNumber}
                                active={pageNumber === currentBalancePage}
                                onClick={() => handleBalancePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </Pagination.Item>
                            );
                          })}
                          
                          <Pagination.Next 
                            onClick={() => handleBalancePageChange(currentBalancePage + 1)}
                            disabled={currentBalancePage === totalBalancePages}
                          />
                          <Pagination.Last 
                            onClick={() => handleBalancePageChange(totalBalancePages)}
                            disabled={currentBalancePage === totalBalancePages}
                          />
                        </Pagination>
                      </div>
                    )}

                    <div className="mt-3 text-muted small">
                      Showing {indexOfFirstBalance + 1} to {Math.min(indexOfLastBalance, filteredBalances.length)} of {filteredBalances.length} records
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <FaMoneyCheckAlt size={40} className="text-muted mb-3" />
                    <p className="text-muted">No outstanding customer balances found</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
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
                
                <h6>Payment Options</h6>
                
                {/* Partial Payment Option */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="partialPayment"
                    label="Allow partial payment (customer will have outstanding balance)"
                    checked={isPartialPayment}
                    onChange={(e) => setIsPartialPayment(e.target.checked)}
                  />
                </Form.Group>

                {isPartialPayment && (
                  <Form.Group className="mb-3">
                    <Form.Label>Partial Payment Amount</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>Ksh</InputGroup.Text>
                      <Form.Control
                        type="number"
                        value={partialPayment}
                        onChange={(e) => setPartialPayment(parseFloat(e.target.value) || 0)}
                        placeholder="Enter amount paid"
                        min="0"
                        max={getCartTotal() - 1}
                        step="0.01"
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Balance: Ksh {(getCartTotal() - partialPayment).toLocaleString()}
                    </Form.Text>
                  </Form.Group>
                )}
                
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

                {/* Payment Summary */}
                <div className="border rounded p-3 bg-light">
                  <h6>Payment Summary</h6>
                  <div className="d-flex justify-content-between">
                    <span>Total Amount:</span>
                    <span className="fw-bold">Ksh {getCartTotal().toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Amount to Pay:</span>
                    <span className="fw-bold text-success">
                      Ksh {(isPartialPayment ? partialPayment : getCartTotal()).toLocaleString()}
                    </span>
                  </div>
                  {isPartialPayment && (
                    <div className="d-flex justify-content-between">
                      <span>Outstanding Balance:</span>
                      <span className="fw-bold text-danger">
                        Ksh {(getCartTotal() - partialPayment).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
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

      {/* Balance Payment Modal */}
      <Modal show={showBalanceModal} onHide={() => setShowBalanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pay Customer Balance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBalance && (
            <Form>
              <h5>Balance Details</h5>
              <p><strong>Customer:</strong> {selectedBalance.customerName}</p>
              <p><strong>Outstanding Balance:</strong> Ksh {selectedBalance.balanceAmount.toLocaleString()}</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Payment Amount</Form.Label>
                <InputGroup>
                  <InputGroup.Text>Ksh</InputGroup.Text>
                  <Form.Control
                    type="number"
                    value={balancePaymentAmount}
                    onChange={(e) => setBalancePaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter payment amount"
                    min="0"
                    max={selectedBalance.balanceAmount}
                    step="0.01"
                  />
                </InputGroup>
              </Form.Group>

              <h6>Payment Method</h6>
              <div className="d-flex gap-2 mb-3">
                <Button
                  variant={balancePaymentMethod === 'cash' ? 'primary' : 'outline-primary'}
                  onClick={() => setBalancePaymentMethod('cash')}
                  className="d-flex flex-column align-items-center p-3"
                >
                  <FaMoneyBill size={24} />
                  <span className="mt-2">Cash</span>
                </Button>
                <Button
                  variant={balancePaymentMethod === 'mpesa' ? 'primary' : 'outline-primary'}
                  onClick={() => setBalancePaymentMethod('mpesa')}
                  className="d-flex flex-column align-items-center p-3"
                >
                  <FaMobile size={24} />
                  <span className="mt-2">M-Pesa</span>
                </Button>
              </div>

              {balancePaymentMethod === 'mpesa' && (
                <Form.Group className="mb-3">
                  <Form.Label>M-Pesa Transaction Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={balanceTransactionCode}
                    onChange={(e) => setBalanceTransactionCode(e.target.value)}
                    placeholder="Enter M-Pesa transaction code"
                    required
                  />
                </Form.Group>
              )}

              <div className="border rounded p-3 bg-light">
                <h6>Payment Summary</h6>
                <div className="d-flex justify-content-between">
                  <span>Current Balance:</span>
                  <span className="fw-bold">Ksh {selectedBalance.balanceAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Payment Amount:</span>
                  <span className="fw-bold text-success">Ksh {balancePaymentAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Remaining Balance:</span>
                  <span className="fw-bold text-danger">
                    Ksh {(selectedBalance.balanceAmount - balancePaymentAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBalanceModal(false)}>
            <FaTimes className="me-1" /> Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleBalancePayment}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <>Processing...</>
            ) : (
              <>
                <FaCheck className="me-1" /> Process Payment
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
                  <tr>
                    <th colSpan={3}>Amount Paid</th>
                    <th className="text-success">Ksh {receiptData.paidAmount.toLocaleString()}</th>
                  </tr>
                  {receiptData.balanceAmount > 0 && (
                    <tr>
                      <th colSpan={3}>Outstanding Balance</th>
                      <th className="text-danger">Ksh {receiptData.balanceAmount.toLocaleString()}</th>
                    </tr>
                  )}
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
                  receiptData.balanceAmount > 0 ? 
                    <Badge bg="warning">Partial Payment</Badge> :
                    receiptData.paymentMethod === 'credit' ? 
                      <Badge bg="warning">Pending</Badge> : 
                      <Badge bg="success">Paid</Badge>
                }</p>
              </div>
              
              <div className="text-center mt-4">
                <p className="mb-1">Thank you for your business!</p>
                <p className="small">For returns or exchanges, please present this receipt within 7 days.</p>
                {receiptData.balanceAmount > 0 && (
                  <p className="small text-danger fw-bold">
                    Outstanding Balance: Ksh {receiptData.balanceAmount.toLocaleString()}
                  </p>
                )}
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
