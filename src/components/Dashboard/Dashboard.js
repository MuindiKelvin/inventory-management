import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { FaChartLine, FaBoxOpen, FaDollarSign, FaStar } from 'react-icons/fa';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, ChartTooltip, Legend);

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [chartFilter, setChartFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
      setSelectedProduct(productList[Math.floor(Math.random() * productList.length)]); // Random spotlight
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const salesData = products.reduce((acc, product) => {
    const date = product.date || '2025-04';
    const sold = parseInt(product.sold) || 0;
    if (!acc[date]) acc[date] = 0;
    acc[date] += sold;
    return acc;
  }, {});

  const filteredChartData = {
    labels: Object.keys(salesData).sort(),
    datasets: [
      {
        label: chartFilter === 'all' ? 'Units Sold Over Time' : `Filtered Sales (${chartFilter})`,
        data: Object.keys(salesData).sort().map(date => salesData[date]),
        fill: chartFilter === 'all' ? false : true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: chartFilter === 'all' ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Sales Trends (${chartFilter === 'all' ? 'Monthly' : 'Filtered'})` },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} units`,
          title: (tooltipItems) => `Month: ${tooltipItems[0].label}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Month' } },
      y: { title: { display: true, text: 'Units Sold' }, beginAtZero: true },
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
    },
  };

  const totalSales = products.reduce((sum, p) => sum + (parseInt(p.sold) * parseInt(p.sellingPrice)), 0);
  const totalProductsSold = products.reduce((sum, p) => sum + parseInt(p.sold), 0);
  const totalStock = products.reduce((sum, p) => sum + parseInt(p.balance), 0);
  const stockPercentage = totalStock > 0 ? Math.min((totalStock / (totalStock + totalProductsSold)) * 100, 100) : 0;

  const topProduct = products.reduce((top, p) => {
    const sales = parseInt(p.sold) * parseInt(p.sellingPrice);
    return sales > (top.sales || 0) ? { ...p, sales } : top;
  }, {});

  const handleChartFilter = (filter) => {
    setChartFilter(filter);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <ClipLoader color="#0288d1" size={50} />
      </div>
    );
  }

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
              <FaChartLine className="me-2" /> Smart Inventory Dashboard
            </h2>
          </Col>
          <Col xs="auto">
            <Button
              variant={chartFilter === 'all' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handleChartFilter('all')}
              className="me-2"
            >
              All Data
            </Button>
            <Button
              variant={chartFilter === 'highlight' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handleChartFilter('highlight')}
            >
              Highlight Trends
            </Button>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col xs={12} md={4} className="mb-3">
            <motion.div
              whileHover={{ scale: 1.03, rotate: 1 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-3 shadow border-0" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                <h5 className="d-flex align-items-center">
                  <FaDollarSign className="me-2 text-success" /> Total Sales (Ksh)
                </h5>
                <p className="h3">{totalSales.toLocaleString()}</p>
                <ProgressBar
                  now={(totalSales / (totalSales + 100000)) * 100}
                  variant="success"
                  style={{ height: '8px' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={12} md={4} className="mb-3">
            <motion.div
              whileHover={{ scale: 1.03, rotate: -1 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-3 shadow border-0" style={{ background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }}>
                <h5 className="d-flex align-items-center">
                  <FaBoxOpen className="me-2 text-warning" /> Total Products Sold
                </h5>
                <p className="h3">{totalProductsSold}</p>
                <ProgressBar
                  now={totalProductsSold / (totalProductsSold + 100) * 100}
                  variant="warning"
                  style={{ height: '8px' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={12} md={4} className="mb-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-3 shadow border-0" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                <h5 className="d-flex align-items-center">
                  <FaBoxOpen className="me-2 text-primary" /> Available Stock
                </h5>
                <p className="h3">{totalStock}</p>
                <ProgressBar
                  now={stockPercentage}
                  variant={stockPercentage < 20 ? 'danger' : 'primary'}
                  style={{ height: '8px' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="p-4 shadow border-0" style={{ background: '#fff' }}>
                <Line data={filteredChartData} options={chartOptions} />
              </Card>
            </motion.div>
          </Col>
          <Col xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-3 shadow border-0" style={{ background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
                <h5 className="d-flex align-items-center">
                  <FaStar className="me-2 text-warning" /> Product Spotlight
                </h5>
                <AnimatePresence>
                  {selectedProduct && (
                    <motion.div
                      key={selectedProduct.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="fw-bold">{selectedProduct.name}</p>
                      <p>Sold: {selectedProduct.sold} units</p>
                      <p>Price: Ksh {selectedProduct.sellingPrice}</p>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Click to view another product</Tooltip>}
                      >
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            const newProduct = products[Math.floor(Math.random() * products.length)];
                            setSelectedProduct(newProduct);
                          }}
                        >
                          Next Product
                        </Button>
                      </OverlayTrigger>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-3 shadow border-0" style={{ background: 'linear-gradient(135deg, #ede7f6, #d1c4e9)' }}>
                <h5>Top Performer</h5>
                <p className="fw-bold">{topProduct.name || 'N/A'}</p>
                <p>Total Revenue: Ksh {topProduct.sales?.toLocaleString() || 0}</p>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </Container>
  );
};

export default Dashboard;