const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure uploads directories exist
const productUploadDir = path.join(__dirname, '../uploads/products')
const documentUploadDir = path.join(__dirname, '../uploads/documents')

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true })
}

if (!fs.existsSync(documentUploadDir)) {
  fs.mkdirSync(documentUploadDir, { recursive: true })
}

// Configure multer storage for products (images)
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

// Configure multer storage for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentUploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

// File filter for images (products)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'))
  }
}

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|jpg|jpeg|png|gif|webp|txt|csv/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only document files (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images) are allowed'))
  }
}

// Configure multer for products (images)
const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: imageFileFilter
})

// Configure multer for documents
const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: documentFileFilter
})

// Middleware for single image upload
const uploadSingle = productUpload.single('image')

// Middleware for single document upload
const uploadDocument = documentUpload.single('document')

// Middleware wrapper to handle multer errors for images
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        })
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      })
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
    next()
  })
}

// Middleware wrapper to handle multer errors for documents
const handleDocumentUpload = (req, res, next) => {
  uploadDocument(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 25MB.'
        })
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      })
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
    next()
  })
}

// Helper function to delete uploaded file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
  } catch (error) {
    console.error('Error deleting file:', error)
  }
  return false
}

// Helper function to get file URL for products
const getFileUrl = (filename) => {
  if (!filename) return null
  return `/uploads/products/${filename}`
}

// Helper function to get document URL
const getDocumentUrl = (filename) => {
  if (!filename) return null
  return `/uploads/documents/${filename}`
}

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to get file type icon
const getFileTypeIcon = (filename) => {
  const ext = path.extname(filename).toLowerCase()
  const iconMap = {
    '.pdf': '📄',
    '.doc': '📝',
    '.docx': '📝',
    '.ppt': '📊',
    '.pptx': '📊',
    '.xls': '📈',
    '.xlsx': '📈',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.webp': '🖼️',
    '.txt': '📄',
    '.csv': '📊'
  }
  return iconMap[ext] || '📄'
}

module.exports = {
  upload: productUpload,
  documentUpload,
  handleUpload,
  handleDocumentUpload,
  deleteFile,
  getFileUrl,
  getDocumentUrl,
  formatFileSize,
  getFileTypeIcon
}
