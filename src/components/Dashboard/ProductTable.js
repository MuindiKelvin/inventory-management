import React, { useState, useRef } from 'react';
import { Table, Button, Modal, Form, InputGroup, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useReactToPrint } from 'react-to-print';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { BsPrinter } from 'react-icons/bs';
import { FaEdit, FaTrash, FaTag, FaBarcode, FaDollarSign, FaBox, FaCalendar } from 'react-icons/fa';

const ProductTable = ({ products, refreshProducts }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const receiptRef = useRef();
  const itemsPerPage = 5;
  const pageCount = Math.ceil(products.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = products.slice(offset, offset + itemsPerPage);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleEdit = (product) => {
    setEditProduct({ ...product, id: product.id });
    setShowEditModal(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success(
          <div>
            <FaBox className="me-2" /> Product <strong>{name}</strong> deleted!
          </div>,
          { position: 'top-right', autoClose: 3000 }
        );
        refreshProducts();
      } catch (error) {
        toast.error('Error deleting product: ' + error.message, { position: 'top-right', autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProduct(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateDerivedFields = (product) => {
    const quantity = parseInt(product.quantity);
    const price = parseInt(product.price);
    const sold = parseInt(product.sold || 0);
    
    return {
      total: price * quantity,
      balance: quantity - sold
    };
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { total, balance } = calculateDerivedFields(editProduct);

    const productData = {
      name: editProduct.name,
      barcode: editProduct.barcode,
      price: parseInt(editProduct.price),
      quantity: parseInt(editProduct.quantity),
      total,
      sellingPrice: parseInt(editProduct.sellingPrice),
      sold: parseInt(editProduct.sold || 0),
      balance,
      category: editProduct.category || 'Uncategorized',
      date: editProduct.date,
    };

    try {
      const productRef = doc(db, 'products', editProduct.id);
      await updateDoc(productRef, productData);
      toast.success(
        <div>
          <FaBox className="me-2" /> Product <strong>{editProduct.name}</strong> updated!
        </div>,
        { position: 'top-right', autoClose: 3000 }
      );
      setShowEditModal(false);
      setEditProduct(null);
      refreshProducts();
    } catch (error) {
      toast.error('Error updating product: ' + error.message, { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div>
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
          <AnimatePresence>
            {currentItems.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
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
                  <Badge bg={product.balance < 10 ? 'danger' : 'success'}>{product.balance}</Badge>
                </td>
                <td>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Print receipt for {product.name}</Tooltip>}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handlePrintReceipt(product)}
                      disabled={loading}
                      className="me-2"
                    >
                      <BsPrinter />
                    </Button>
                  </OverlayTrigger>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Edit {product.name}</Tooltip>}>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      disabled={loading}
                      className="me-2"
                    >
                      <FaEdit />
                    </Button>
                  </OverlayTrigger>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Delete {product.name}</Tooltip>}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={loading}
                    >
                      <FaTrash />
                    </Button>
                  </OverlayTrigger>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </Table>
      <ReactPaginate
        previousLabel={'Previous'}
        nextLabel={'Next'}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        containerClassName={'pagination justify-content-center mt-3'}
        pageClassName={'page-item'}
        pageLinkClassName={'page-link'}
        previousClassName={'page-item'}
        previousLinkClassName={'page-link'}
        nextClassName={'page-item'}
        nextLinkClassName={'page-link'}
        activeClassName={'active'}
        disabledClassName={'disabled'}
      />

      {/* Edit Product Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{ background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)' }}
        >
          <Modal.Title className="d-flex align-items-center">
            <FaEdit className="me-2 text-primary" /> Edit Product
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editProduct && (
            <Form onSubmit={handleEditSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaTag className="me-2 text-muted" /> Product Name
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        name="name"
                        value={editProduct.name}
                        onChange={handleEditChange}
                        placeholder="Enter product name"
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaBarcode className="me-2 text-muted" /> Barcode/QR Code
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="barcode"
                      value={editProduct.barcode}
                      onChange={handleEditChange}
                      placeholder="Enter barcode or QR code"
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaTag className="me-2 text-muted" /> Category
                    </Form.Label>
                    <Form.Select
                      name="category"
                      value={editProduct.category}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Food">Food</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaCalendar className="me-2 text-muted" /> Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={editProduct.date}
                      onChange={handleEditChange}
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaDollarSign className="me-2 text-muted" /> Price per Item (Ksh)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={editProduct.price}
                      onChange={handleEditChange}
                      placeholder="Enter price"
                      required
                      min="0"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaDollarSign className="me-2 text-muted" /> Selling Price per Item (Ksh)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="sellingPrice"
                      value={editProduct.sellingPrice}
                      onChange={handleEditChange}
                      placeholder="Enter selling price"
                      required
                      min="0"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaBox className="me-2 text-muted" /> Quantity
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      value={editProduct.quantity}
                      onChange={handleEditChange}
                      placeholder="Enter quantity"
                      required
                      min="0"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaBox className="me-2 text-muted" /> Sold
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="sold"
                      value={editProduct.sold || 0}
                      onChange={handleEditChange}
                      placeholder="Enter sold quantity"
                      min="0"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row mt-3">
                <div className="col-md-12">
                  <div className="d-flex gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg, #0288d1, #0277bd)', border: 'none' }}
                      >
                        <FaEdit className="me-2" /> {loading ? 'Updating...' : 'Update Product'}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowEditModal(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

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
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{selectedProduct.date}</td>
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
    </div>
  );
};

export default ProductTable;