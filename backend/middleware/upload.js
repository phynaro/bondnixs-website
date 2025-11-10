const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Ensure uploads directories exist
const productUploadDir = path.join(__dirname, '../uploads/products')
const documentUploadDir = path.join(__dirname, '../uploads/documents')
const fileStorageUploadDir = path.join(__dirname, '../uploads/storage')

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true })
}

if (!fs.existsSync(documentUploadDir)) {
  fs.mkdirSync(documentUploadDir, { recursive: true })
}

if (!fs.existsSync(fileStorageUploadDir)) {
  fs.mkdirSync(fileStorageUploadDir, { recursive: true })
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

// Configure multer storage for file storage
const fileStorageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize files by year/month for better organization
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const dateDir = path.join(fileStorageUploadDir, String(year), month)
    
    // Create date-based directory if it doesn't exist
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true })
    }
    
    cb(null, dateDir)
  },
  filename: (req, file, cb) => {
    // Sanitize original filename
    const sanitized = sanitizeFilename(file.originalname)
    const ext = path.extname(file.originalname)
    const shortId = generateShortId()
    
    // Format: sanitized-name-{shortId}.ext
    // Example: product-catalog-a1b2c3d4.pdf
    const filename = `${sanitized}-${shortId}${ext}`
    
    cb(null, filename)
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

// File filter for file storage (more permissive)
const fileStorageFileFilter = (req, file, cb) => {
  // Allow most common file types
  const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|jpg|jpeg|png|gif|webp|txt|csv|zip|rar|7z|tar|gz|json|xml|html|css|js|ts|py|java|cpp|c|h|svg|ico|mp4|mp3|wav|avi|mov|mkv/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  
  // More lenient MIME type checking
  if (extname) {
    return cb(null, true)
  } else {
    cb(new Error('File type not allowed. Please upload a supported file type.'))
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

// Configure multer for file storage
const fileStorageUpload = multer({
  storage: fileStorageStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: fileStorageFileFilter
})

// Middleware for single image upload
const uploadSingle = productUpload.single('image')

// Middleware for single document upload
const uploadDocument = documentUpload.single('document')

// Middleware for single file storage upload
const uploadFileStorage = fileStorageUpload.single('file')

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

// Middleware wrapper to handle multer errors for file storage
const handleFileStorageUpload = (req, res, next) => {
  uploadFileStorage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 100MB.'
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

// Helper function to get file storage URL
const getFileStorageUrl = (filename) => {
  if (!filename) return null
  
  // If filename contains path separators (from date-based folders), use as-is
  // Otherwise, try to extract date from filename or use current date
  if (filename.includes('/') || filename.includes('\\')) {
    // Already has path structure
    return `/uploads/storage/${filename.replace(/\\/g, '/')}`
  }
  
  // For backward compatibility with old files, check if file exists in root
  // Otherwise, construct path based on current date structure
  // Note: This is a fallback - new files will have the full path stored in DB
  return `/uploads/storage/${filename}`
}

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to sanitize filename
const sanitizeFilename = (filename) => {
  // Remove extension
  const ext = path.extname(filename)
  const nameWithoutExt = path.basename(filename, ext)
  
  // Sanitize: remove special characters, replace spaces with hyphens, limit length
  let sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit to 100 characters
  
  // If sanitized name is empty, use 'file'
  if (!sanitized) {
    sanitized = 'file'
  }
  
  return sanitized
}

// Helper function to generate short unique ID
const generateShortId = () => {
  return crypto.randomBytes(4).toString('hex') // 8 character hex string
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
  fileStorageUpload,
  handleUpload,
  handleDocumentUpload,
  handleFileStorageUpload,
  deleteFile,
  getFileUrl,
  getDocumentUrl,
  getFileStorageUrl,
  formatFileSize,
  getFileTypeIcon
}
