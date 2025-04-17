import React, { useState, useEffect, useRef } from 'react';
import { Container, Table, Button, Row, Col, Modal, Badge } from 'react-bootstrap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { BsPrinter } from 'react-icons/bs';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { FaTag } from 'react-icons/fa';

const PrintReceipts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productList);
      } catch (error) {
        toast.error('Error fetching products: ' + error.message, {
          position: 'top-right',
          autoClose: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handlePrintReceipt = (product) => {
    setSelectedProduct(product);
    setShowReceiptModal(true);
  };

  const printReceipt = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => {
      setShowReceiptModal(false);
      toast.success(`Receipt for ${selectedProduct.name} printed successfully!`, {
        position: 'top-right',
        autoClose: 2000
      });
    }
  });

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4">Print Receipts</h2>
        <Table striped bordered hover responsive>
          <thead style={{ background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)' }}>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Barcode/QR</th>
              <th>Price/Item (Ksh)</th>
              <th>Qty</th>
              <th>Total (Ksh)</th>
              <th>Selling Price (Ksh)</th>
              <th>Sold</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <td>{product.name}</td>
                <td>
                  <Badge bg={product.category === 'Electronics' ? 'primary' : product.category === 'Clothing' ? 'warning' : 'secondary'}>
                    {product.category || 'Uncategorized'}
                  </Badge>
                </td>
                <td>{product.barcode}</td>
                <td>{product.price.toLocaleString()}</td>
                <td>{product.quantity}</td>
                <td>{product.total.toLocaleString()}</td>
                <td>{product.sellingPrice.toLocaleString()}</td>
                <td>{product.sold}</td>
                <td>
                  <Badge bg={product.balance < 10 ? 'danger' : 'success'}>
                    {product.balance}
                  </Badge>
                </td>
                <td>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handlePrintReceipt(product)}
                      disabled={loading}
                    >
                      <BsPrinter className="me-2" /> Print Receipt
                    </Button>
                  </motion.div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </motion.div>

      {/* Receipt Modal */}
      <Modal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)' }}>
          <Modal.Title className="d-flex align-items-center">
            <BsPrinter className="me-2 text-primary" /> Product Receipt
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              {/* This is the receipt content that will be printed */}
              <div ref={receiptRef} style={{ padding: '20px', fontFamily: 'Arial' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#0288d1', marginBottom: '5px' }}>Inventory Receipt</h3>
                  <p style={{ fontSize: '14px', color: '#555' }}>Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Product:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Category:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.category || 'Uncategorized'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Barcode/QR:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.barcode}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Price/Item (Ksh):</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.price.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Quantity:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.quantity}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Total (Ksh):</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.total.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Selling Price (Ksh):</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.sellingPrice.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Sold:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.sold}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Balance Stock:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.balance}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Date:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.date || new Date().toLocaleDateString()}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#777', marginTop: '30px' }}>
                  <p>Thank you for using our inventory management system.</p>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={printReceipt}
                    variant="primary"
                    style={{ background: 'linear-gradient(135deg, #0288d1, #0277bd)', border: 'none' }}
                  >
                    <BsPrinter className="me-2" /> Print Receipt
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PrintReceipts;