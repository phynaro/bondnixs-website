import axios from 'axios'

// Create axios instance with base configuration
const getBaseURL = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('Using explicit API URL:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || 
                import.meta.env.MODE === 'development' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
  
  console.log('Environment detection:', {
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
    hostname: window.location.hostname,
    port: window.location.port,
    isDev: isDev
  })
  
  if (isDev) {
    // Check if we're running through nginx (port 80) or direct (port 5173)
    const isNginxProxy = window.location.port === '80' || window.location.port === '443' || window.location.port === ''
    
    if (isNginxProxy) {
      console.log('Using nginx-proxied API URL: http://localhost/api')
      return 'http://localhost/api'
    } else {
      console.log('Using direct development API URL: http://localhost:3001')
      return 'http://localhost:3001'
    }
  }
  
  console.log('Using production API URL: https://www.bondnixs.co.th/api')
  return 'https://www.bondnixs.co.th/api'
}

const baseURL = getBaseURL()
console.log('API Base URL:', baseURL)

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Important for cookies
  timeout: 10000
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      // Only redirect if:
      // 1. Not already on login page to avoid infinite loops
      // 2. Not on public pages (pages that don't require authentication)
      // 3. Not calling auth/me endpoint (which is used to check auth status)
      const isPublicPage = !window.location.pathname.startsWith('/admin')
      const isAuthCheck = error.config?.url?.includes('/api/auth/me')
      
      if (!window.location.pathname.includes('/admin/login') && 
          !isPublicPage && 
          !isAuthCheck) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper function to get the correct API path
const getApiPath = (path) => {
  // If baseURL already includes /api, don't add it again
  if (api.defaults.baseURL.includes('/api')) {
    return path.replace('/api', '')
  }
  return path
}

// Auth API functions
export const authAPI = {
  // Get current user info
  getCurrentUser: () => api.get(getApiPath('/api/auth/me')),
  
  // Logout
  logout: () => api.post(getApiPath('/api/auth/logout')),
  
  // Initiate Google OAuth (redirect)
  googleLogin: () => {
    window.location.href = `${api.defaults.baseURL}${getApiPath('/api/auth/google')}`
  }
}

// Category API functions
export const categoryAPI = {
  // Public category APIs
  getCategories: () => api.get(getApiPath('/api/categories')),
  
  getProductsByCategory: () => api.get(getApiPath('/api/categories/products')),
  
  // Admin category APIs
  createCategory: (categoryData) => api.post(getApiPath('/api/categories'), categoryData),
  
  updateCategory: (id, categoryData) => api.put(getApiPath(`/api/categories/${id}`), categoryData),
  
  deleteCategory: (id) => api.delete(getApiPath(`/api/categories/${id}`)),
  
  updateCategoryOrder: (id, display_order) => api.patch(getApiPath(`/api/categories/${id}/reorder`), { display_order })
}

// Product API functions
export const productAPI = {
  // Public product APIs
  getProducts: () => api.get(getApiPath('/api/products')),
  
  getProductByModel: (model) => api.get(getApiPath(`/api/products/${model}`)),
  
  // Admin product APIs
  getAllProductsAdmin: () => api.get(getApiPath('/api/products/admin/all')),
  
  createProduct: (productData) => {
    const formData = new FormData()
    
    // Add text fields
    formData.append('model', productData.model)
    formData.append('name', productData.name)
    formData.append('short_brief', productData.short_brief || '')
    formData.append('description', productData.description || '')
    formData.append('published', productData.published)
    formData.append('category_id', productData.category_id)
    
    // Add JSON fields
    formData.append('features', JSON.stringify(productData.features || []))
    formData.append('specs', JSON.stringify(productData.specs || []))
    
    // Add image if provided
    if (productData.image) {
      formData.append('image', productData.image)
    }
    
    return api.post(getApiPath('/api/products'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  updateProduct: (id, productData) => {
    const formData = new FormData()
    
    // Add text fields
    formData.append('model', productData.model)
    formData.append('name', productData.name)
    formData.append('short_brief', productData.short_brief || '')
    formData.append('description', productData.description || '')
    formData.append('published', productData.published)
    formData.append('category_id', productData.category_id)
    
    // Add JSON fields
    formData.append('features', JSON.stringify(productData.features || []))
    formData.append('specs', JSON.stringify(productData.specs || []))
    
    // Add image if provided
    if (productData.image) {
      formData.append('image', productData.image)
    }
    
    return api.put(getApiPath(`/api/products/${id}`), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  deleteProduct: (id) => api.delete(getApiPath(`/api/products/${id}`)),
  
  togglePublish: (id) => api.patch(getApiPath(`/api/products/${id}/publish`))
}

// Document API functions
export const documentAPI = {
  // Get all documents for a product
  getDocuments: (productId) => api.get(getApiPath(`/api/products/${productId}/documents`)),
  
  // Upload document for a product
  uploadDocument: (productId, documentData) => {
    const formData = new FormData()
    
    formData.append('document_name', documentData.document_name)
    formData.append('document_type', documentData.document_type)
    formData.append('document', documentData.file)
    
    return api.post(getApiPath(`/api/products/${productId}/documents`), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Update document metadata
  updateDocument: (productId, documentId, documentData) => 
    api.put(getApiPath(`/api/products/${productId}/documents/${documentId}`), documentData),
  
  // Delete document
  deleteDocument: (productId, documentId) => 
    api.delete(getApiPath(`/api/products/${productId}/documents/${documentId}`))
}

// Utility functions
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // Otherwise, construct the full URL
  const baseURL = api.defaults.baseURL
  return `${baseURL}${imagePath}`
}

export const getDocumentUrl = (documentPath) => {
  if (!documentPath) return null
  
  // If it's already a full URL, return as is
  if (documentPath.startsWith('http')) {
    return documentPath
  }
  
  // Otherwise, construct the full URL
  const baseURL = api.defaults.baseURL
  return `${baseURL}${documentPath}`
}

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to get file type icon
export const getFileTypeIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const iconMap = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'ppt': '📊',
    'pptx': '📊',
    'xls': '📈',
    'xlsx': '📈',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'webp': '🖼️',
    'txt': '📄',
    'csv': '📊'
  }
  return iconMap[ext] || '📄'
}

// Contact API functions
export const contactAPI = {
  // Submit contact form
  submitContactForm: (formData) => api.post(getApiPath('/api/contact'), formData),
  
  // Admin contact APIs
  getMessages: () => api.get(getApiPath('/api/contact')),
  
  getMessage: (id) => api.get(getApiPath(`/api/contact/${id}`)),
  
  deleteMessage: (id) => api.delete(getApiPath(`/api/contact/${id}`)),
  
  updateMessageStatus: (id, status) => api.patch(getApiPath(`/api/contact/${id}/status`), { status })
}

// Recipient API functions
export const recipientAPI = {
  // Admin recipient APIs
  getRecipients: () => api.get(getApiPath('/api/recipients')),
  
  createRecipient: (data) => api.post(getApiPath('/api/recipients'), data),
  
  updateRecipient: (id, data) => api.put(getApiPath(`/api/recipients/${id}`), data),
  
  deleteRecipient: (id) => api.delete(getApiPath(`/api/recipients/${id}`)),
  
  toggleActive: (id) => api.patch(getApiPath(`/api/recipients/${id}/toggle`))
}

// File Storage API functions
export const fileStorageAPI = {
  // Get all files
  getFiles: () => api.get(getApiPath('/api/files')),
  
  // Get file by ID
  getFile: (id) => api.get(getApiPath(`/api/files/${id}`)),
  
  // Upload file
  uploadFile: (file, description = '') => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    
    return api.post(getApiPath('/api/files'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Update file metadata
  updateFile: (id, description) => 
    api.put(getApiPath(`/api/files/${id}`), { description }),
  
  // Delete file
  deleteFile: (id) => api.delete(getApiPath(`/api/files/${id}`)),
  
  // Get file link
  getFileLink: (id) => api.get(getApiPath(`/api/files/${id}/link`)),
  
  // Get file activities
  getFileActivities: (id) => api.get(getApiPath(`/api/files/${id}/activities`))
}

export default api
