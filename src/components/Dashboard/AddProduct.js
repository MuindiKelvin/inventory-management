import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Table, OverlayTrigger, Tooltip, InputGroup, Badge, Modal, Pagination, Image, Alert, Spinner } from 'react-bootstrap';
import { collection, addDoc, getDocs, updateDoc, doc, query, limit, startAfter, orderBy, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db, storage } from '../../firebase/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaPlus, FaBarcode, FaBox, FaDollarSign, FaCalendar, FaSearch, FaTag, FaEdit, FaTimes, FaShoppingCart, FaImage, FaAlignLeft, FaLayerGroup, FaSave, FaExclamationTriangle, FaTrash, FaCheck } from 'react-icons/fa';

// Debug mode flag
const DEBUG = true;

// Verify Firebase initialization
const verifyFirebaseConfig = () => {
  if (!db || !storage) {
    console.error('Firebase initialization failed. Check your firebaseConfig.js');
    return false;
  }
  return true;
};

const AddProduct = () => {
  // Product state
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
    description: '',
    imageUrl: '',
  });
  
  // UI states
  const [existingProducts, setExistingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTotal, setPreviewTotal] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [soldError, setSoldError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Category management
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Firebase and auth states
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [user, setUser] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const productsPerPage = 5;

  // Initialize Firebase and auth
  useEffect(() => {
    const initFirebase = async () => {
      const isInitialized = verifyFirebaseConfig();
      setFirebaseInitialized(isInitialized);
      
      if (!isInitialized) {
        setErrorMessage('Firebase configuration error. Please check your setup.');
        return;
      }

      // Check authentication status
      const auth = getAuth();
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (DEBUG) console.log('Auth state changed:', currentUser ? 'Logged in' : 'Not logged in');
      });

      await fetchCategories();
      await fetchProductsFirstPage();
    };
    initFirebase();
  }, []);

  // Calculate preview total
  useEffect(() => {
    const price = parseInt(product.price) || 0;
    const quantity = parseInt(product.quantity) || 0;
    setPreviewTotal(price * quantity);
  }, [product.price, product.quantity]);

  // Clear success state after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCategories = async () => {
    try {
      if (DEBUG) console.log('Fetching categories...');
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoryList = querySnapshot.docs.map(doc => doc.data().name);
      setCategories(categoryList);
      if (DEBUG) console.log('Categories fetched:', categoryList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setErrorMessage(`Failed to load categories: ${error.code} - ${error.message}`);
      toast.error('Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      if (DEBUG) console.log('Adding new category:', newCategory);
      const docRef = await addDoc(collection(db, 'categories'), { 
        name: newCategory.trim(),
        createdAt: new Date(),
        createdBy: user ? user.uid : 'anonymous'
      });
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      setShowCategoryModal(false);
      toast.success(`Category "${newCategory.trim()}" added successfully!`);
      if (DEBUG) console.log('Category added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding category:', error);
      setErrorMessage(`Failed to add category: ${error.code} - ${error.message}`);
      toast.error('Failed to add category');
    }
  };

  const fetchProductsFirstPage = async () => {
    setLoadingPage(true);
    setErrorMessage('');
    
    try {
      if (DEBUG) console.log('Fetching products for page 1...');
      const snapshot = await getDocs(collection(db, 'products'));
      const totalItems = snapshot.docs.length;
      setTotalPages(Math.ceil(totalItems / productsPerPage));
      
      const q = query(
        collection(db, 'products'), 
        orderBy('name'),
        limit(productsPerPage)
      );
      
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setExistingProducts(productList);
      
      if (querySnapshot.docs.length > 0) {
        setFirstVisible(querySnapshot.docs[0]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      if (DEBUG) console.log('Products fetched:', productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setErrorMessage(`Failed to load products: ${error.code} - ${error.message}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchNextPage = async () => {
    if (loadingPage || currentPage >= totalPages) return;
    
    setLoadingPage(true);
    try {
      if (DEBUG) console.log('Fetching next page:', currentPage + 1);
      const q = query(
        collection(db, 'products'),
        orderBy('name'),
        startAfter(lastVisible),
        limit(productsPerPage)
      );
      
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (productList.length > 0) {
        setExistingProducts(productList);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setCurrentPage(currentPage + 1);
      }
      if (DEBUG) console.log('Next page products:', productList);
    } catch (error) {
      console.error('Error fetching next page:', error);
      setErrorMessage(`Failed to load more products: ${error.code} - ${error.message}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchPrevPage = async () => {
    if (loadingPage || currentPage <= 1) return;
    
    setLoadingPage(true);
    try {
      if (DEBUG) console.log('Fetching previous page:', currentPage - 1);
      const q = query(
        collection(db, 'products'),
        orderBy('name'),
        limit((currentPage - 1) * productsPerPage)
      );
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      
      if (docs.length > 0) {
        const startIndex = Math.max(0, docs.length - productsPerPage);
        const relevantDocs = docs.slice(startIndex);
        
        const productList = relevantDocs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExistingProducts(productList);
        setFirstVisible(relevantDocs[0]);
        setLastVisible(relevantDocs[relevantDocs.length - 1]);
        setCurrentPage(currentPage - 1);
        if (DEBUG) console.log('Previous page products:', productList);
      }
    } catch (error) {
      console.error('Error fetching previous page:', error);
      setErrorMessage(`Failed to load previous products: ${error.code} - ${error.message}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image is too large. Maximum size is 2MB.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    if (DEBUG) console.log('Image selected:', file.name, 'Size:', file.size);
  };

  const uploadImage = async (productId, retries = 3) => {
    if (!imageFile) {
      if (DEBUG) console.log('No new image to upload, using existing:', product.imageUrl);
      return product.imageUrl || '';
    }
    
    setUploadingImage(true);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (DEBUG) console.log(`Uploading image for product ${productId} (Attempt ${attempt}/${retries})`);
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `product_${productId}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `product_images/${fileName}`);
        
        const uploadResult = await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        if (DEBUG) console.log('Image uploaded successfully:', downloadURL);
        return downloadURL;
      } catch (error) {
        console.error(`Image upload attempt ${attempt} failed:`, error);
        if (error.message.includes('cors')) {
          throw new Error('Image upload failed due to CORS policy. Please configure CORS for Firebase Storage or test without an image.');
        }
        if (attempt === retries) {
          throw new Error(`Failed to upload product image after ${retries} attempts: ${error.message}`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (['price', 'quantity', 'sellingPrice', 'sold'].includes(name)) {
      if (value && value < 0) return;
    }
    
    setProduct(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (name === 'sold' || name === 'quantity') {
      const quantity = name === 'quantity' ? parseInt(value) || 0 : parseInt(product.quantity) || 0;
      const sold = name === 'sold' ? parseInt(value) || 0 : parseInt(product.sold) || 0;
      
      if (sold > quantity) {
        setSoldError('Sold units cannot exceed quantity.');
      } else {
        setSoldError('');
      }
    }
  };

  const validateProduct = () => {
    const requiredFields = ['name', 'price', 'quantity', 'category'];
    for (const field of requiredFields) {
      if (!product[field]) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required.`);
        return false;
      }
    }
    
    const numericFields = ['price', 'quantity', 'sellingPrice', 'sold'];
    for (const field of numericFields) {
      const value = parseInt(product[field]);
      if (isNaN(value) || value < 0) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} must be a positive number.`);
        return false;
      }
    }
    
    if (parseInt(product.sold) > parseInt(product.quantity)) {
      toast.error('Sold units cannot exceed quantity.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firebaseInitialized) {
      setErrorMessage('Firebase is not properly initialized');
      toast.error('Database connection error');
      return;
    }

    if (!user) {
      setErrorMessage('Please sign in to add or update products');
      toast.error('Authentication required');
      return;
    }

    if (!validateProduct()) {
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    setSuccess(false);
    
    try {
      if (DEBUG) console.log('Submitting product:', product);
      const quantity = parseInt(product.quantity);
      const price = parseInt(product.price);
      const sellingPrice = parseInt(product.sellingPrice);
      const sold = parseInt(product.sold) || 0;
      const balance = quantity - sold;
      
      // Prepare product data
      const productData = {
        name: product.name.trim(),
        barcode: product.barcode.trim(),
        price,
        quantity,
        sellingPrice,
        date: product.date,
        sold,
        balance,
        total: price * quantity,
        category: product.category,
        description: product.description.trim(),
        imageUrl: product.imageUrl || '',
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      // Attempt image upload, but don't fail the entire submission if it fails
      if (imageFile) {
        try {
          const tempId = editMode ? editProductId : Date.now().toString();
          productData.imageUrl = await uploadImage(tempId).finally(() => setUploadingImage(false));
        } catch (imageError) {
          console.error('Image upload failed, proceeding without image:', imageError);
          setErrorMessage(imageError.message);
          toast.error('Image upload failed, but product will be saved without an image.');
          productData.imageUrl = ''; // Proceed without an image
        }
      }
      
      if (editMode) {
        if (DEBUG) console.log('Updating product:', editProductId);
        const productRef = doc(db, 'products', editProductId);
        await updateDoc(productRef, productData);
        toast.success(`Product "${product.name}" updated successfully!`);
        setEditMode(false);
        setEditProductId(null);
        setSuccess(true);
      } else {
        if (DEBUG) console.log('Adding new product');
        productData.createdAt = new Date();
        productData.createdBy = user.uid;
        const docRef = await addDoc(collection(db, 'products'), productData);
        setSuccess(true);
        toast.success(`Product "${product.name}" added successfully!`);
        if (DEBUG) console.log('Product added with ID:', docRef.id);
      }
      
      resetForm();
      await fetchProductsFirstPage();
    } catch (error) {
      console.error('Error saving product:', error);
      setErrorMessage(`Failed to ${editMode ? 'update' : 'add'} product: ${error.code} - ${error.message}`);
      toast.error(`Error ${editMode ? 'updating' : 'adding'} product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    if (!user) {
      setErrorMessage('Please sign in to delete products');
      toast.error('Authentication required');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      if (DEBUG) console.log('Deleting product:', productToDelete.id);
      await deleteDoc(doc(db, 'products', productToDelete.id));
      toast.success(`Product "${productToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setProductToDelete(null);
      await fetchProductsFirstPage();
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage(`Failed to delete product: ${error.code} - ${error.message}`);
      toast.error('Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
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
      description: '',
      imageUrl: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setPreviewTotal(0);
    setSoldError('');
    setErrorMessage('');
  };

  const handleEdit = async (productId) => {
    try {
      setLoading(true);
      setSuccess(false);
      
      if (DEBUG) console.log('Fetching product for edit:', productId);
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        
        setProduct({
          name: productData.name || '',
          barcode: productData.barcode || '',
          price: productData.price || '',
          quantity: productData.quantity || '',
          sellingPrice: productData.sellingPrice || '',
          date: productData.date || new Date().toISOString().split('T')[0],
          sold: productData.sold || 0,
          balance: productData.balance || 0,
          category: productData.category || '',
          description: productData.description || '',
          imageUrl: productData.imageUrl || '',
        });
        
        if (productData.imageUrl) {
          setImagePreview(productData.imageUrl);
        }
        
        setEditMode(true);
        setEditProductId(productId);
        
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        if (DEBUG) console.log('Product loaded for edit:', productData);
      } else {
        console.error('Product not found:', productId);
        toast.error('Product not found.');
      }
    } catch (error) {
      console.error('Error fetching product for edit:', error);
      setErrorMessage(`Failed to load product details: ${error.code} - ${error.message}`);
      toast.error('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditProductId(null);
    setSuccess(false);
    resetForm();
  };

  const filteredProducts = existingProducts.filter(prod =>
    prod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prod.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prod.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {errorMessage && (
          <Alert variant="danger" className="mb-4">
            <FaExclamationTriangle className="me-2" />
            {errorMessage}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-4">
            <FaCheck className="me-2" />
            Product {editMode ? 'updated' : 'added'} successfully!
          </Alert>
        )}
        
        {!firebaseInitialized && (
          <Alert variant="warning" className="mb-4">
            <FaExclamationTriangle className="me-2" />
            Firebase is not properly initialized. Please check your configuration.
          </Alert>
        )}
        
        {!user && (
          <Alert variant="warning" className="mb-4">
            <FaExclamationTriangle className="me-2" />
            Please sign in to manage products. Some features are disabled.
          </Alert>
        )}
        
        <Row className="align-items-center mb-3">
          <Col>
            <h2 className="d-flex align-items-center mb-3">
              {editMode ? (
                <><FaEdit className="me-2 text-warning" /> Edit Product</>
              ) : (
                <><FaPlus className="me-2 text-primary" /> Add New Product</>
              )}
            </h2>
          </Col>
        </Row>
        
        <Row>
          <Col xs={12} lg={6} className="mb-4">
            <Card className="shadow border-0">
              <Card.Header className="bg-primary bg-gradient text-white py-3">
                <h5 className="mb-0">
                  {editMode ? 'Update Product Details' : 'Enter Product Details'}
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  <h6 className="text-muted mb-3">Basic Information</h6>
                  <Row>
                    <Col xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaTag className="me-2" /> Product Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={product.name}
                          onChange={handleChange}
                          placeholder="Enter product name"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaBarcode className="me-2" /> Barcode/SKU
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="barcode"
                          value={product.barcode}
                          onChange={handleChange}
                          placeholder="Product barcode or SKU"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaLayerGroup className="me-2" /> Category
                        </Form.Label>
                        <InputGroup>
                          <Form.Select
                            name="category"
                            value={product.category}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select category</option>
                            {categories.map((cat, idx) => (
                              <option key={idx} value={cat}>{cat}</option>
                            ))}
                            <option value="Uncategorized">Uncategorized</option>
                          </Form.Select>
                          <Button 
                            variant="outline-secondary"
                            onClick={() => setShowCategoryModal(true)}
                          >
                            <FaPlus /> New
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6 className="text-muted mb-3 mt-4">Product Image</h6>
                  <Row className="mb-3">
                    <Col xs={12} md={8}>
                      <Form.Group>
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaImage className="me-2" /> Upload Image
                        </Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <Form.Text className="text-muted">
                          Maximum file size: 2MB. Supported formats: JPG, PNG, GIF
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      {imagePreview ? (
                        <div className="text-center mt-2">
                          <Image 
                            src={imagePreview} 
                            thumbnail 
                            style={{ maxHeight: '80px', objectFit: 'contain' }} 
                          />
                        </div>
                      ) : (
                        <div className="text-center bg-light p-3 mt-2 rounded">
                          <FaImage size={24} className="text-muted" />
                          <p className="small text-muted mb-0">No image</p>
                        </div>
                      )}
                    </Col>
                  </Row>

                  <h6 className="text-muted mb-3 mt-4">Inventory Details</h6>
                  <Row>
                    <Col xs={6} md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaDollarSign className="me-1" /> Price (Ksh)
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="price"
                          value={product.price}
                          onChange={handleChange}
                          placeholder="0"
                          required
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaBox className="me-1" /> Quantity
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="quantity"
                          value={product.quantity}
                          onChange={handleChange}
                          placeholder="0"
                          required
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaShoppingCart className="me-1" /> Sold
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="sold"
                          value={product.sold}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                          isInvalid={!!soldError}
                        />
                        <Form.Control.Feedback type="invalid">
                          {soldError}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaDollarSign className="me-1" /> Selling Price
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="sellingPrice"
                          value={product.sellingPrice}
                          onChange={handleChange}
                          placeholder="0"
                          required
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center fw-bold">
                          <FaCalendar className="me-2" /> Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={product.date}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="d-flex align-items-center">
                      <div className="d-flex flex-column w-100">
                        <div className="mb-1 fw-bold small">Summary</div>
                        <Row className="g-2">
                          <Col>
                            <Badge bg="info" className="d-block p-2 text-start">
                              Total Value: Ksh {previewTotal.toLocaleString()}
                            </Badge>
                          </Col>
                          <Col>
                            <Badge bg="secondary" className="d-block p-2 text-start">
                              Balance: {Math.max((parseInt(product.quantity) || 0) - (parseInt(product.sold) || 0), 0)} units
                            </Badge>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>

                  <h6 className="text-muted mb-3 mt-4">Additional Information</h6>
                  <Form.Group className="mb-4">
                    <Form.Label className="d-flex align-items-center fw-bold">
                      <FaAlignLeft className="me-2" /> Product Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={product.description}
                      onChange={handleChange}
                      placeholder="Enter product details, specifications, etc."
                    />
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end">
                    {editMode && (
                      <Button
                        variant="outline-secondary"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        <FaTimes className="me-1" /> Cancel
                      </Button>
                    )}
                    <Button
                      variant={editMode ? "warning" : success ? "success" : "primary"}
                      type="submit"
                      disabled={loading || uploadingImage || !!soldError || !firebaseInitialized || !user}
                      className="px-4"
                    >
                      {loading || uploadingImage ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          {editMode ? 'Updating...' : 'Saving...'}
                        </>
                      ) : success ? (
                        <>
                          <FaCheck className="me-2" /> Saved!
                        </>
                      ) : (
                        <>
                          {editMode ? (
                            <><FaSave className="me-2" /> Update Product</>
                          ) : (
                            <><FaPlus className="me-2" /> Add Product</>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={6}>
            <Card className="shadow border-0">
              <Card.Header className="bg-success bg-gradient text-white py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaBox className="me-2" /> Product Inventory
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="p-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, category or barcode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </div>
                
                <div style={{ minHeight: '400px' }}>
                  {loadingPage ? (
                    <div className="text-center p-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">Loading products...</p>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <Table hover responsive className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th className="text-center">In Stock</th>
                          <th className="text-center">Price</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredProducts.map((product, index) => (
                            <motion.tr
                              key={product.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className="align-middle"
                            >
                              <td>
                                <div className="d-flex align-items-center">
                                  {product.imageUrl ? (
                                    <Image 
                                      src={product.imageUrl} 
                                      roundedCircle 
                                      width={40} 
                                      height={40} 
                                      className="me-2"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div className="bg-light rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                      <FaBox className="text-muted" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-bold">{product.name}</div>
                                    {product.barcode && (
                                      <small className="text-muted">{product.barcode}</small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="secondary">{product.category || 'Uncategorized'}</Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg={product.balance <= 0 ? 'danger' : product.balance < 10 ? 'warning' : 'success'} pill>
                                  {product.balance || 0}
                                </Badge>
                              </td>
                              <td className="text-center">
                                Ksh {(product.sellingPrice || 0).toLocaleString()}
                              </td>
                              <td className="text-center">
                                <OverlayTrigger placement="top" overlay={<Tooltip>Edit product</Tooltip>}>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleEdit(product.id)}
                                    disabled={loading || !user}
                                    className="me-2"
                                  >
                                    <FaEdit />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger placement="top" overlay={<Tooltip>Delete product</Tooltip>}>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => confirmDelete(product)}
                                    disabled={loading || !user}
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
                  ): (
                    <div className="text-center p-5">
                      <FaBox size={40} className="text-muted mb-3" />
                      <p className="text-muted">
                        {searchTerm 
                          ? "No products match your search criteria." 
                          : "No products have been added yet."}
                      </p>
                      {searchTerm && (
                        <Button variant="link" onClick={() => setSearchTerm('')}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {!searchTerm && totalPages > 1 && (
                  <div className="d-flex justify-content-center p-3 border-top">
                    <Pagination size="sm">
                      <Pagination.Prev 
                        onClick={fetchPrevPage} 
                        disabled={currentPage === 1 || loadingPage}
                      />
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }
                        return (
                          <Pagination.Item 
                            key={pageNum} 
                            active={pageNum === currentPage}
                            disabled={loadingPage}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next 
                        onClick={fetchNextPage} 
                        disabled={currentPage === totalPages || loadingPage}
                      />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            <Card className="shadow border-0 mt-4">
              <Card.Header className="bg-info bg-gradient text-white py-3">
                <h5 className="mb-0">Pro Tips</h5>
              </Card.Header>
              <Card.Body className="p-3">
                <ul className="mb-0">
                  <li>Adding images to products improves identification at a glance.</li>
                  <li>Keep your categories consistent to improve inventory organization.</li>
                  <li>Make sure to regularly update stock levels to maintain accuracy.</li>
                  <li>Use detailed descriptions for complex products or specifications.</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </motion.div>

      <Modal 
        show={showCategoryModal} 
        onHide={() => setShowCategoryModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Category Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter new category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddCategory}
            disabled={!newCategory.trim() || !user}
          >
            <FaPlus className="me-1" /> Add Category
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the product "{productToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowDeleteModal(false);
              setProductToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-1" /> Delete Product
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AddProduct;