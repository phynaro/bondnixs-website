const express = require('express')
const router = express.Router()
const { productQueries, categoryQueries, documentQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { handleUpload, handleDocumentUpload, deleteFile, getFileUrl, getDocumentUrl, formatFileSize, getFileTypeIcon } = require('../middleware/upload')

// Public routes

// Get all published products
router.get('/', async (req, res) => {
  try {
    const result = await productQueries.getAllProducts()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    })
  }
})

// Get product by model
router.get('/:model', async (req, res) => {
  try {
    const { model } = req.params
    const result = await productQueries.getProductByModel(model)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    })
  }
})

// Admin routes (protected)

// Get all products (including unpublished) - Admin only
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await productQueries.getAllProductsAdmin()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching all products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    })
  }
})

// Create new product - Admin only
router.post('/', authenticateToken, requireAdmin, handleUpload, async (req, res) => {
  try {
    const { model, name, short_brief, description, features, specs, published, category_id } = req.body
    
    // Validate required fields
    if (!model || !name || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Model, name, and category are required'
      })
    }

    // Validate category exists
    const categoryResult = await categoryQueries.getCategoryById(category_id)
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      })
    }

    // Parse JSON fields
    let parsedFeatures = []
    let parsedSpecs = []
    
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid features format'
        })
      }
    }

    if (specs) {
      try {
        parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs
        // Ensure specs is an array
        if (!Array.isArray(parsedSpecs)) {
          // Convert old object format to array format for backward compatibility
          if (typeof parsedSpecs === 'object' && parsedSpecs !== null) {
            parsedSpecs = Object.entries(parsedSpecs).map(([key, value]) => ({
              key,
              value
            }))
          } else {
            parsedSpecs = []
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid specs format'
        })
      }
    }

    // Handle image upload
    let imageUrl = null
    if (req.file) {
      imageUrl = getFileUrl(req.file.filename)
    }

    const productData = {
      model,
      name,
      short_brief: short_brief || null,
      description: description || null,
      image_url: imageUrl,
      features: parsedFeatures,
      specs: JSON.stringify(parsedSpecs), // Convert array to JSON string for JSONB
      category_id,
      published: published === 'true' || published === true
    }

    // Debug logging
    console.log('Product data being sent to database:', {
      ...productData,
      specs: parsedSpecs,
      specsType: typeof parsedSpecs,
      specsIsArray: Array.isArray(parsedSpecs),
      specsStringified: JSON.stringify(parsedSpecs)
    })

    const result = await productQueries.createProduct(productData)
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Product created successfully'
    })
  } catch (error) {
    console.error('Error creating product:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }

    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Product model already exists'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create product'
      })
    }
  }
})

// Update product - Admin only
router.put('/:id', authenticateToken, requireAdmin, handleUpload, async (req, res) => {
  try {
    const { id } = req.params
    const { model, name, short_brief, description, features, specs, published, category_id } = req.body

    // Validate required fields
    if (!model || !name || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Model, name, and category are required'
      })
    }

    // Validate category exists
    const categoryResult = await categoryQueries.getCategoryById(category_id)
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      })
    }

    // Get existing product to check for image
    const existingResult = await productQueries.getProductById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    const existingProduct = existingResult.rows[0]

    // Parse JSON fields
    let parsedFeatures = []
    let parsedSpecs = []
    
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid features format'
        })
      }
    }

    if (specs) {
      try {
        parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs
        // Ensure specs is an array
        if (!Array.isArray(parsedSpecs)) {
          // Convert old object format to array format for backward compatibility
          if (typeof parsedSpecs === 'object' && parsedSpecs !== null) {
            parsedSpecs = Object.entries(parsedSpecs).map(([key, value]) => ({
              key,
              value
            }))
          } else {
            parsedSpecs = []
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid specs format'
        })
      }
    }

    // Handle image upload
    let imageUrl = existingProduct.image_url
    if (req.file) {
      // Delete old image if it exists
      if (existingProduct.image_url) {
        const oldImagePath = existingProduct.image_url.replace('/uploads/products/', '')
        deleteFile(require('path').join(__dirname, '../uploads/products', oldImagePath))
      }
      imageUrl = getFileUrl(req.file.filename)
    }

    const productData = {
      model,
      name,
      short_brief: short_brief || null,
      description: description || null,
      image_url: imageUrl,
      features: parsedFeatures,
      specs: JSON.stringify(parsedSpecs), // Convert array to JSON string for JSONB
      category_id,
      published: published === 'true' || published === true
    }

    // Debug logging
    console.log('Product data being sent to database:', {
      ...productData,
      specs: parsedSpecs,
      specsType: typeof parsedSpecs,
      specsIsArray: Array.isArray(parsedSpecs),
      specsStringified: JSON.stringify(parsedSpecs)
    })

    const result = await productQueries.updateProduct(id, productData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating product:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }

    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Product model already exists'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update product'
      })
    }
  }
})

// Delete product - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Get product to check for image
    const existingResult = await productQueries.getProductById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    const product = existingResult.rows[0]

    // Delete product from database
    await productQueries.deleteProduct(id)

    // Delete associated image file
    if (product.image_url) {
      const imagePath = product.image_url.replace('/uploads/products/', '')
      deleteFile(require('path').join(__dirname, '../uploads/products', imagePath))
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    })
  }
})

// Toggle publish status - Admin only
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await productQueries.togglePublish(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Product ${result.rows[0].published ? 'published' : 'unpublished'} successfully`
    })
  } catch (error) {
    console.error('Error toggling publish status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update publish status'
    })
  }
})

// Document routes

// Get all documents for a product - Public
router.get('/:productId/documents', async (req, res) => {
  try {
    const { productId } = req.params
    const result = await documentQueries.getDocumentsByProductId(productId)
    
    // Add file type icons and formatted file sizes
    const documents = result.rows.map(doc => ({
      ...doc,
      file_type_icon: getFileTypeIcon(doc.file_url),
      formatted_file_size: formatFileSize(doc.file_size)
    }))

    res.json({
      success: true,
      data: documents
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    })
  }
})

// Upload document for a product - Admin only
router.post('/:productId/documents', authenticateToken, requireAdmin, handleDocumentUpload, async (req, res) => {
  try {
    const { productId } = req.params
    const { document_name, document_type } = req.body

    // Validate required fields
    if (!document_name || !document_type) {
      return res.status(400).json({
        success: false,
        message: 'Document name and type are required'
      })
    }

    // Check if product exists
    const productResult = await productQueries.getProductById(productId)
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Handle file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const documentData = {
      product_id: productId,
      document_name: document_name.trim(),
      document_type: document_type.trim(),
      file_url: getDocumentUrl(req.file.filename),
      file_size: req.file.size
    }

    const result = await documentQueries.createDocument(documentData)
    
    res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        file_type_icon: getFileTypeIcon(result.rows[0].file_url),
        formatted_file_size: formatFileSize(result.rows[0].file_size)
      },
      message: 'Document uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    })
  }
})

// Update document metadata - Admin only
router.put('/:productId/documents/:documentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId, documentId } = req.params
    const { document_name, document_type } = req.body

    // Validate required fields
    if (!document_name || !document_type) {
      return res.status(400).json({
        success: false,
        message: 'Document name and type are required'
      })
    }

    // Check if document exists and belongs to the product
    const existingResult = await documentQueries.getDocumentById(documentId)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }

    const existingDocument = existingResult.rows[0]
    if (existingDocument.product_id !== productId) {
      return res.status(400).json({
        success: false,
        message: 'Document does not belong to this product'
      })
    }

    const documentData = {
      document_name: document_name.trim(),
      document_type: document_type.trim()
    }

    const result = await documentQueries.updateDocument(documentId, documentData)
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        file_type_icon: getFileTypeIcon(result.rows[0].file_url),
        formatted_file_size: formatFileSize(result.rows[0].file_size)
      },
      message: 'Document updated successfully'
    })
  } catch (error) {
    console.error('Error updating document:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    })
  }
})

// Delete document - Admin only
router.delete('/:productId/documents/:documentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId, documentId } = req.params

    // Check if document exists and belongs to the product
    const existingResult = await documentQueries.getDocumentById(documentId)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }

    const existingDocument = existingResult.rows[0]
    if (existingDocument.product_id !== productId) {
      return res.status(400).json({
        success: false,
        message: 'Document does not belong to this product'
      })
    }

    // Delete document from database
    await documentQueries.deleteDocument(documentId)

    // Delete associated file
    const filePath = existingDocument.file_url.replace('/uploads/documents/', '')
    deleteFile(require('path').join(__dirname, '../uploads/documents', filePath))

    res.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    })
  }
})

module.exports = router
