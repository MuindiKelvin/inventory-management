import React, { useState, useEffect, useRef } from 'react';
import { Container, Table, Button, Row, Col, Modal, Badge, Form, Dropdown, Pagination, InputGroup, Image, Card } from 'react-bootstrap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { BsPrinter, BsFilter, BsSearch, BsSortDown, BsSortUp, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { FaTag, FaFileExport, FaReceipt, FaShoppingCart, FaTimes } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [lowStockAlert, setLowStockAlert] = useState(10);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedProducts, setPaginatedProducts] = useState([]);
  
  const receiptRef = useRef();
  const inventoryRef = useRef();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(productList.map(product => 
          product.category || 'Uncategorized'))];
        setCategories(uniqueCategories);
        
        setProducts(productList);
        setFilteredProducts(productList);
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

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, sortField, sortDirection, filterCategory, products]);

  useEffect(() => {
    paginateProducts();
  }, [filteredProducts, currentPage, itemsPerPage]);

  const applyFiltersAndSort = () => {
    let result = [...products];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory && filterCategory !== 'All') {
      result = result.filter(product => 
        product.category === filterCategory || 
        (!product.category && filterCategory === 'Uncategorized')
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    setFilteredProducts(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const paginateProducts = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setPaginatedProducts(filteredProducts.slice(indexOfFirstItem, indexOfLastItem));
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category) => {
    setFilterCategory(category);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePrintReceipt = (product) => {
    setSelectedProduct(product);
    setShowReceiptModal(true);
  };

  const printReceipt = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${selectedProduct?.name || 'Product'}`,
    onAfterPrint: () => {
      setShowReceiptModal(false);
      toast.success(`Receipt for ${selectedProduct.name} printed successfully!`, {
        position: 'top-right',
        autoClose: 2000
      });
    },
    onPrintError: (error) => {
      toast.error('Error printing receipt: ' + error.message, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  });

  const printInventory = useReactToPrint({
    content: () => inventoryRef.current,
    documentTitle: `Inventory-Report-${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        body {
          font-size: 12px;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        table {
          border-collapse: collapse;
          width: 100% !important;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #000 !important;
          padding: 4px !important;
          text-align: left;
          page-break-inside: avoid;
        }
        th {
          background-color: #f8f9fa !important;
          font-weight: bold;
        }
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .print-header h1 {
          margin: 0;
          font-size: 24px;
          color: #000;
        }
        .print-header p {
          margin: 5px 0;
          font-size: 12px;
        }
        .print-summary {
          margin-top: 20px;
          border-top: 2px solid #000;
          padding-top: 10px;
        }
        .badge {
          border: 1px solid #000 !important;
          padding: 2px 6px !important;
          border-radius: 3px !important;
          font-size: 10px !important;
        }
        .low-stock-row {
          background-color: #ffe6e6 !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      // You can add any pre-processing logic here
      console.log('Preparing inventory report for printing...');
    },
    onAfterPrint: () => {
      toast.success("Product inventory report printed successfully!", {
        position: 'top-right',
        autoClose: 2000
      });
    },
    onPrintError: (error) => {
      toast.error('Error printing inventory: ' + error.message, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  });

  // Prepare CSV data for export
  const csvData = [
    ['#', 'Product', 'Category', 'Barcode/QR', 'Price/Item (Ksh)', 'Qty', 'Total (Ksh)', 'Selling Price (Ksh)', 'Sold', 'Balance'],
    ...filteredProducts.map((product, index) => [
      index + 1,
      product.name,
      product.category || 'Uncategorized',
      product.barcode,
      product.price,
      product.quantity,
      product.total,
      product.sellingPrice,
      product.sold,
      product.balance
    ])
  ];

  const createPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <Pagination.Item key="first" active={currentPage === 1} onClick={() => paginate(1)}>
        1
      </Pagination.Item>
    );
    
    // If not showing second page, maybe add ellipsis
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" />);
    }
    
    // Add page before current if needed
    if (currentPage > 2) {
      items.push(
        <Pagination.Item key={currentPage - 1} onClick={() => paginate(currentPage - 1)}>
          {currentPage - 1}
        </Pagination.Item>
      );
    }
    
    // Add current page if not first or last
    if (currentPage !== 1 && currentPage !== totalPages) {
      items.push(
        <Pagination.Item key={currentPage} active>
          {currentPage}
        </Pagination.Item>
      );
    }
    
    // Add page after current if needed
    if (currentPage < totalPages - 1) {
      items.push(
        <Pagination.Item key={currentPage + 1} onClick={() => paginate(currentPage + 1)}>
          {currentPage + 1}
        </Pagination.Item>
      );
    }
    
    // If not showing second-to-last page, maybe add ellipsis
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" />);
    }
    
    // Always show last page if more than one page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item key="last" active={currentPage === totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  // Component to render printable inventory
  const PrintableInventory = React.forwardRef((props, ref) => {
    const totalValue = filteredProducts.reduce((sum, product) => sum + (product.total || 0), 0);
    const totalItems = filteredProducts.reduce((sum, product) => sum + (product.quantity || 0), 0);
    const lowStockItems = filteredProducts.filter(p => p.balance < lowStockAlert);

    return (
      <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div className="print-header">
          <h1>SABREHAWK STORES</h1>
          <p>123 Business Street, Nairobi, Kenya</p>
          <p>Tel: +254 724 864 985 | Email: info@sabrehawkstores.com</p>
          <h2>INVENTORY REPORT</h2>
          <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          <p>Filter: {filterCategory !== 'All' ? `Category - ${filterCategory}` : 'All Categories'}</p>
          {searchTerm && <p>Search: "{searchTerm}"</p>}
        </div>

        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Category</th>
              <th>Barcode/QR</th>
              <th>Price/Item (Ksh)</th>
              <th>Qty</th>
              <th>Total (Ksh)</th>
              <th>Selling Price (Ksh)</th>
              <th>Sold</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr
                key={product.id}
                className={product.balance < lowStockAlert ? 'low-stock-row' : ''}
              >
                <td>{index + 1}</td>
                <td>{product.name}</td>
                <td>
                  <span className="badge">
                    {product.category || 'Uncategorized'}
                  </span>
                </td>
                <td>{product.barcode}</td>
                <td>{product.price?.toLocaleString()}</td>
                <td>{product.quantity}</td>
                <td>{product.total?.toLocaleString()}</td>
                <td>{product.sellingPrice?.toLocaleString()}</td>
                <td>{product.sold}</td>
                <td>
                  <span className={`badge ${product.balance < lowStockAlert ? 'badge-danger' : 'badge-success'}`}>
                    {product.balance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="print-summary">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <strong>Total Products:</strong> {filteredProducts.length}
            </div>
            <div>
              <strong>Total Items:</strong> {totalItems.toLocaleString()}
            </div>
            <div>
              <strong>Total Inventory Value:</strong> Ksh {totalValue.toLocaleString()}
            </div>
          </div>
          
          {lowStockItems.length > 0 && (
            <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ff0000', backgroundColor: '#ffe6e6' }}>
              <h4 style={{ color: '#ff0000', margin: '0 0 10px 0' }}>LOW STOCK ALERT</h4>
              <p>The following {lowStockItems.length} item(s) are running low on stock (below {lowStockAlert} units):</p>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                {lowStockItems.map(item => (
                  <li key={item.id}>
                    <strong>{item.name}</strong> - Balance: {item.balance} units
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            <p>This report was generated automatically by the Sabrehawk Inventory Management System</p>
            <p>Report ID: INV-{Date.now().toString().substring(5)}</p>
          </div>
        </div>
      </div>
    );
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
        <Row className="mb-4 align-items-center">
          <Col>
            <h2>Product Management</h2>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={printInventory}
                disabled={loading || filteredProducts.length === 0}
              >
                <BsPrinter className="me-2" /> Print Inventory
              </Button>
              
              <CSVLink 
                data={csvData} 
                filename={`product-inventory-${new Date().toISOString().split('T')[0]}.csv`}
                className="btn btn-outline-success"
              >
                <FaFileExport className="me-2" /> Export CSV
              </CSVLink>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6} lg={4}>
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <BsSearch />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Search by product name or barcode..."
                  value={searchTerm}
                  onChange={handleSearch}
                  id="product-management-search"
                />
              </div>
            </Form.Group>
          </Col>
          
          <Col md={4} lg={3}>
            <Form.Group className="mb-3">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="category-filter-dropdown" className="w-100">
                  <BsFilter className="me-2" /> {filterCategory} Categories
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {categories.map(category => (
                    <Dropdown.Item 
                      key={category} 
                      onClick={() => handleCategoryFilter(category)}
                      active={filterCategory === category}
                    >
                      {category}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>
          </Col>
          
          <Col md={2} lg={2}>
            <Form.Group className="mb-3">
              <Form.Control
                type="number"
                placeholder="Low stock alert"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
              />
            </Form.Group>
          </Col>
          
          <Col md={2} lg={2}>
            <Form.Group className="mb-3">
              <Form.Select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col xs={12}>
            <div className="alert alert-info py-2">
              Showing {paginatedProducts.length} of {filteredProducts.length} products
              {filteredProducts.filter(p => p.balance < lowStockAlert).length > 0 && (
                <span className="ms-2 text-danger">
                  ({filteredProducts.filter(p => p.balance < lowStockAlert).length} low stock items)
                </span>
              )}
            </div>
          </Col>
        </Row>

        <div className="table-responsive p-2">
          <Table striped bordered hover responsive>
            <thead style={{ background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)' }}>
              <tr>
                <th>#</th>
                <th onClick={() => handleSort('name')} className="cursor-pointer">
                  Product {sortField === 'name' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th onClick={() => handleSort('category')} className="cursor-pointer">
                  Category {sortField === 'category' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th>Barcode/QR</th>
                <th onClick={() => handleSort('price')} className="cursor-pointer">
                  Price/Item (Ksh) {sortField === 'price' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th onClick={() => handleSort('quantity')} className="cursor-pointer">
                  Qty {sortField === 'quantity' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th onClick={() => handleSort('total')} className="cursor-pointer">
                  Total (Ksh) {sortField === 'total' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th onClick={() => handleSort('sellingPrice')} className="cursor-pointer">
                  Selling Price (Ksh) {sortField === 'sellingPrice' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th onClick={() => handleSort('sold')} className="cursor-pointer">
                  Sold {sortField === 'sold' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th onClick={() => handleSort('balance')} className="cursor-pointer">
                  Balance {sortField === 'balance' && (sortDirection === 'asc' ? <BsSortUp /> : <BsSortDown />)}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    background: product.balance < lowStockAlert ? 'rgba(255, 235, 238, 0.5)' : 'transparent'
                  }}
                >
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{product.name}</td>
                  <td>
                    <Badge bg={
                      product.category === 'Electronics' ? 'primary' : 
                      product.category === 'Clothing' ? 'warning' : 
                      product.category === 'Furniture' ? 'success' :
                      product.category === 'Food' ? 'danger' : 'secondary'
                    }>
                      {product.category || 'Uncategorized'}
                    </Badge>
                  </td>
                  <td>{product.barcode}</td>
                  <td>{product.price?.toLocaleString()}</td>
                  <td>{product.quantity}</td>
                  <td>{product.total?.toLocaleString()}</td>
                  <td>{product.sellingPrice?.toLocaleString()}</td>
                  <td>{product.sold}</td>
                  <td>
                    <Badge bg={product.balance < lowStockAlert ? 'danger' : 'success'}>
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
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <Pagination>
                <Pagination.Prev 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <BsChevronLeft />
                </Pagination.Prev>
                
                {createPaginationItems()}
                
                <Pagination.Next 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <BsChevronRight />
                </Pagination.Next>
              </Pagination>
            </div>
          )}

          {paginatedProducts.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Hidden printable inventory component */}
      <div style={{ display: 'none' }}>
        <PrintableInventory ref={inventoryRef} />
      </div>

      {/* Receipt Modal */}
      <Modal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Purchase Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div ref={receiptRef} className="p-3 border">
              <div className="text-center mb-3">
                <h4>SABREHAWK STORES</h4>
                <p className="mb-1">123 Business Street</p>
                <p className="mb-1">Nairobi, Kenya</p>
                <p className="mb-3">Tel: +254 724 864 985</p>
                <h5>RECEIPT</h5>
                <p className="mb-0">Receipt #: INV-{Date.now().toString().substring(6)}</p>
                <p>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              </div>
              
              <div className="mb-3">
                <p className="mb-1"><strong>Product Details</strong></p>
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
                  <tr>
                    <td>{selectedProduct.name}</td>
                    <td>{selectedProduct.quantity}</td>
                    <td>Ksh {selectedProduct.price?.toLocaleString()}</td>
                    <td>Ksh {selectedProduct.total?.toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3}>Total</th>
                    <th>Ksh {selectedProduct.total?.toLocaleString()}</th>
                  </tr>
                </tfoot>
              </Table>
              
              <div className="mb-3">
                <p className="mb-1"><strong>Category:</strong> {selectedProduct.category || 'Uncategorized'}</p>
                <p className="mb-1"><strong>Barcode:</strong> {selectedProduct.barcode}</p>
                <p className="mb-1"><strong>Selling Price:</strong> Ksh {selectedProduct.sellingPrice?.toLocaleString()}</p>
                <p className="mb-1"><strong>Current Stock:</strong> {selectedProduct.balance}</p>
                <p className="mb-1"><strong>Status:</strong> <Badge bg="success">Inventory</Badge></p>
              </div>
              
              <div className="text-center mt-4">
                <p className="mb-1">Thank you for using our inventory system!</p>
                <p className="small">This is an inventory record. Not a sales receipt.</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
            <FaTimes className="me-2" /> Close
          </Button>
          <Button variant="primary" onClick={printReceipt}>
            <FaReceipt className="me-2" /> Print Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductManagement;