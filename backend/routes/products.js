const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { productQueries, categoryQueries, documentQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { handleUpload, handleDocumentUpload, deleteFile, getFileUrl, getDocumentUrl, formatFileSize, getFileTypeIcon } = require('../middleware/upload')
const { sendContactNotification } = require('../services/emailService')
const { 
  contactRateLimit, 
  emailCooldownCheck, 
  trackSubmission, 
  honeypotValidation, 
  contentValidation 
} = require('../middleware/rateLimiting')

// Helper function to detect if specs are in tabular format
function isTabularSpecs(specs) {
  if (!specs) return false
  if (Array.isArray(specs)) return false // key-value format
  if (typeof specs === 'object' && specs !== null && specs.format === 'tabular' && specs.columns && specs.rows) {
    return true
  }
  return false
}

// Validate tabular specs structure
function validateTabularSpecs(specs) {
  if (!specs || typeof specs !== 'object') {
    return { valid: false, error: 'Tabular specs must be an object' }
  }
  
  if (specs.format !== 'tabular') {
    return { valid: false, error: 'Tabular specs must have format: "tabular"' }
  }
  
  if (!Array.isArray(specs.columns) || specs.columns.length === 0) {
    return { valid: false, error: 'Tabular specs must have at least one column' }
  }
  
  if (!Array.isArray(specs.rows)) {
    return { valid: false, error: 'Tabular specs must have a rows array' }
  }
  
  // Check for unique column names
  const columnNames = specs.columns.map(col => col.name)
  const uniqueNames = new Set(columnNames)
  if (uniqueNames.size !== columnNames.length) {
    return { valid: false, error: 'Column names must be unique' }
  }
  
  // Validate rows match column structure (optional - can be lenient)
  // We'll just check that rows are objects, not validate every field
  
  return { valid: true }
}

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
    let parsedSpecs = null
    
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
        
        // Check if it's tabular format
        if (isTabularSpecs(parsedSpecs)) {
          // Validate tabular specs
          const validation = validateTabularSpecs(parsedSpecs)
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              message: `Invalid tabular specs format: ${validation.error}`
            })
          }
          // Keep as-is for tabular format
        } else {
          // Handle key-value format (existing logic)
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
      specs: parsedSpecs ? JSON.stringify(parsedSpecs) : null, // Convert to JSON string for JSONB
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
    let parsedSpecs = null
    
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
        
        // Check if it's tabular format
        if (isTabularSpecs(parsedSpecs)) {
          // Validate tabular specs
          const validation = validateTabularSpecs(parsedSpecs)
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              message: `Invalid tabular specs format: ${validation.error}`
            })
          }
          // Keep as-is for tabular format
        } else {
          // Handle key-value format (existing logic)
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
      specs: parsedSpecs ? JSON.stringify(parsedSpecs) : null, // Convert to JSON string for JSONB
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

// Request document download - Public (with user info)
router.post('/:productId/documents/:documentId/download', 
  contactRateLimit,
  honeypotValidation,
  contentValidation,
  emailCooldownCheck,
  trackSubmission,
  async (req, res) => {
    try {
      const { productId, documentId } = req.params
      const { name, email, company, phone } = req.body

      // Basic validation
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required'
        })
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        })
      }

      // Fetch document details
      const documentResult = await documentQueries.getDocumentById(documentId)
      if (documentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        })
      }

      const document = documentResult.rows[0]
      
      // Verify document belongs to the product
      if (document.product_id !== productId) {
        return res.status(400).json({
          success: false,
          message: 'Document does not belong to this product'
        })
      }

      // Fetch product details
      const productResult = await productQueries.getProductById(productId)
      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        })
      }

      const product = productResult.rows[0]

      // Auto-generate subject and message
      const subject = `Document Download Request - ${document.document_name}`
      const message = `User downloaded: ${document.document_name} (${document.document_type}) for product ${product.model}`

      // Save to contact_messages table
      const result = await pool.query(`
        INSERT INTO contact_messages (name, email, company, phone, subject, message, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, company, phone, subject, message, status, created_at
      `, [name, email, company || null, phone || null, subject, message, 'new'])

      const savedMessage = result.rows[0]

      // Get active recipients
      const recipientsResult = await pool.query(`
        SELECT id, name, email FROM email_recipients WHERE active = true
      `)

      const recipients = recipientsResult.rows

      if (recipients.length > 0) {
        try {
          // Send notification email to admin recipients
          // Include product and document info in the message
          const notificationMessage = {
            ...savedMessage,
            product_name: product.name,
            product_model: product.model,
            document_name: document.document_name,
            document_type: document.document_type,
            is_document_download: true
          }
          await sendContactNotification(notificationMessage, recipients)
          console.log('Document download notification email sent successfully')
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError)
          // Don't fail the request if email fails
        }
      }

      // Return document URL for immediate download
      const baseUrl = req.protocol + '://' + req.get('host')
      const documentUrl = baseUrl + document.file_url

      res.json({
        success: true,
        data: {
          documentUrl: documentUrl,
          documentName: document.document_name
        }
      })
    } catch (error) {
      console.error('Error processing document download request:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to process download request. Please try again later.'
      })
    }
  }
)

module.exports = router
