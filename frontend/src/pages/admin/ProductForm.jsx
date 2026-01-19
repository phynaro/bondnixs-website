import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productAPI, productImageAPI, categoryAPI, documentAPI, getImageUrl, getDocumentUrl, formatFileSize, getFileTypeIcon } from '../../services/api'

// Helper function to detect if specs are in tabular format
function isTabularSpecs(specs) {
  if (!specs) return false
  if (Array.isArray(specs)) return false // key-value format
  if (typeof specs === 'object' && specs !== null && specs.format === 'tabular' && specs.columns && specs.rows) {
    return true
  }
  return false
}

const ProductForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    model: '',
    name: '',
    short_brief: '',
    description: '',
    features: [],
    specs: [], // Changed from {} to [] for ordered specifications
    category_id: '',
    published: true,
    display_order: 0,
    images: [] // Array of File objects for new images
  })
  const [specsFormat, setSpecsFormat] = useState('keyvalue') // 'keyvalue' or 'tabular'
  const [tabularSpecs, setTabularSpecs] = useState({
    columns: [],
    rows: []
  })
  const [existingImages, setExistingImages] = useState([]) // Array of existing images from API
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [documents, setDocuments] = useState([])
  const [documentLoading, setDocumentLoading] = useState(false)
  const [newDocument, setNewDocument] = useState({
    file: null,
    document_name: '',
    document_type: ''
  })

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryAPI.getCategories()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  const fetchProduct = useCallback(async () => {
    try {
      const response = await productAPI.getAllProductsAdmin()
      
      // Ensure all products have images array before processing (fixes d.images.length error)
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        response.data.data = response.data.data.map(d => ({
          ...d,
          images: (d.images && Array.isArray(d.images)) ? d.images : []
        }))
      }
      
      const product = response.data.data.find(p => p.id === id)
      
      if (product) {
        // Ensure images is always an array before processing
        if (!product.images || !Array.isArray(product.images)) {
          product.images = []
        }
        
        // Detect format and load accordingly
        if (isTabularSpecs(product.specs)) {
          // Tabular format
          setSpecsFormat('tabular')
          setTabularSpecs({
            columns: product.specs.columns || [],
            rows: product.specs.rows || []
          })
          setFormData({
            model: product.model,
            name: product.name,
            short_brief: product.short_brief || '',
            description: product.description || '',
            features: product.features || [],
            specs: [],
            category_id: product.category_id || '',
            published: product.published,
            display_order: product.display_order || 0,
            images: [] // Fixed: should be images (plural), not image (singular)
          })
        } else {
          // Key-value format
          setSpecsFormat('keyvalue')
          let specsArray = []
          if (product.specs) {
            if (Array.isArray(product.specs)) {
              // New format: array of {key, value, order}
              specsArray = product.specs.map(spec => ({
                key: spec.key || '',
                value: spec.value || ''
              }))
            } else {
              // Old format: object - convert to array (order not preserved)
              specsArray = Object.entries(product.specs).map(([key, value]) => ({
                key,
                value
              }))
            }
          }
          setFormData({
            model: product.model,
            name: product.name,
            short_brief: product.short_brief || '',
            description: product.description || '',
            features: product.features || [],
            specs: specsArray,
            category_id: product.category_id || '',
            published: product.published,
            display_order: product.display_order || 0,
            images: []
          })
        }
        // Load existing images
        if (product.images && Array.isArray(product.images)) {
          setExistingImages(product.images)
        } else {
          setExistingImages([])
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('Failed to load product')
    }
  }, [id])

  const fetchDocuments = useCallback(async () => {
    if (!isEdit) return
    
    try {
      setDocumentLoading(true)
      const response = await documentAPI.getDocuments(id)
      setDocuments(response.data.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setDocumentLoading(false)
    }
  }, [id, isEdit])

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchProduct()
      fetchDocuments()
    }
  }, [isEdit, fetchProduct, fetchCategories, fetchDocuments])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) : value)
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...files].slice(0, 10) // Max 10 images
      }))
    }
    // Reset input to allow selecting same file again
    e.target.value = ''
  }

  const removeNewImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleDeleteExistingImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      await productImageAPI.deleteImage(id, imageId)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
      alert('Image deleted successfully!')
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }

  const handleSetPrimaryImage = async (imageId) => {
    try {
      await productImageAPI.setPrimaryImage(id, imageId)
      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })))
      alert('Primary image updated successfully!')
    } catch (error) {
      console.error('Error setting primary image:', error)
      alert('Failed to set primary image')
    }
  }

  const moveImageUp = (index, isExisting) => {
    if (isExisting) {
      // Reorder existing images
      const newImages = [...existingImages]
      if (index === 0) return
      const temp = newImages[index]
      newImages[index] = newImages[index - 1]
      newImages[index - 1] = temp
      setExistingImages(newImages)
      // Update display_order via API
      const imageOrders = newImages.map((img, i) => ({
        id: img.id,
        display_order: i
      }))
      productImageAPI.reorderImages(id, imageOrders).catch(err => {
        console.error('Error reordering images:', err)
        // Revert on error
        fetchProduct()
      })
    } else {
      // Reorder new images
      setFormData(prev => {
        const newImages = [...prev.images]
        if (index === 0) return prev
        const temp = newImages[index]
        newImages[index] = newImages[index - 1]
        newImages[index - 1] = temp
        return { ...prev, images: newImages }
      })
    }
  }

  const moveImageDown = (index, isExisting) => {
    if (isExisting) {
      // Reorder existing images
      const newImages = [...existingImages]
      if (index === newImages.length - 1) return
      const temp = newImages[index]
      newImages[index] = newImages[index + 1]
      newImages[index + 1] = temp
      setExistingImages(newImages)
      // Update display_order via API
      const imageOrders = newImages.map((img, i) => ({
        id: img.id,
        display_order: i
      }))
      productImageAPI.reorderImages(id, imageOrders).catch(err => {
        console.error('Error reordering images:', err)
        // Revert on error
        fetchProduct()
      })
    } else {
      // Reorder new images
      setFormData(prev => {
        const newImages = [...prev.images]
        if (index === newImages.length - 1) return prev
        const temp = newImages[index]
        newImages[index] = newImages[index + 1]
        newImages[index + 1] = temp
        return { ...prev, images: newImages }
      })
    }
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const moveFeatureUp = (index) => {
    if (index === 0) return // Can't move first item up
    
    setFormData(prev => {
      const newFeatures = [...prev.features]
      const temp = newFeatures[index]
      newFeatures[index] = newFeatures[index - 1]
      newFeatures[index - 1] = temp
      return {
        ...prev,
        features: newFeatures
      }
    })
  }

  const moveFeatureDown = (index) => {
    setFormData(prev => {
      if (index === prev.features.length - 1) return prev // Can't move last item down
      
      const newFeatures = [...prev.features]
      const temp = newFeatures[index]
      newFeatures[index] = newFeatures[index + 1]
      newFeatures[index + 1] = temp
      return {
        ...prev,
        features: newFeatures
      }
    })
  }

  const addSpec = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { key: '', value: '' }]
    }))
  }

  const updateSpec = (index, field, newValue) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.map((spec, i) => 
        i === index ? { ...spec, [field]: newValue } : spec
      )
    }))
  }

  const removeSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index)
    }))
  }

  const moveSpecUp = (index) => {
    if (index === 0) return // Can't move first item up
    
    setFormData(prev => {
      const newSpecs = [...prev.specs]
      const temp = newSpecs[index]
      newSpecs[index] = newSpecs[index - 1]
      newSpecs[index - 1] = temp
      return {
        ...prev,
        specs: newSpecs
      }
    })
  }

  const moveSpecDown = (index) => {
    setFormData(prev => {
      if (index === prev.specs.length - 1) return prev // Can't move last item down
      
      const newSpecs = [...prev.specs]
      const temp = newSpecs[index]
      newSpecs[index] = newSpecs[index + 1]
      newSpecs[index + 1] = temp
      return {
        ...prev,
        specs: newSpecs
      }
    })
  }

  // Tabular specs management functions
  const addTabularColumn = () => {
    setTabularSpecs(prev => ({
      ...prev,
      columns: [...prev.columns, { name: '', type: 'text' }]
      // Don't add empty key to rows - will be added when column name is set
    }))
  }

  const updateTabularColumn = (index, field, value) => {
    setTabularSpecs(prev => {
      const oldColumnName = prev.columns[index]?.name
      const newColumns = prev.columns.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      )
      
      // Update row data if column name changed
      let newRows = prev.rows
      if (field === 'name') {
        if (oldColumnName && oldColumnName !== value) {
          // Column name changed - update existing rows
          newRows = prev.rows.map(row => {
            const newRow = { ...row }
            if (oldColumnName in newRow) {
              newRow[value] = newRow[oldColumnName]
              delete newRow[oldColumnName]
            }
            return newRow
          })
        } else if (!oldColumnName && value) {
          // Column name was empty, now has a value - add to existing rows
          newRows = prev.rows.map(row => ({
            ...row,
            [value]: row[value] || ''
          }))
        }
      }
      
      return {
        columns: newColumns,
        rows: newRows
      }
    })
  }

  const removeTabularColumn = (index) => {
    setTabularSpecs(prev => {
      const columnName = prev.columns[index]?.name
      const newColumns = prev.columns.filter((_, i) => i !== index)
      const newRows = prev.rows.map(row => {
        const newRow = { ...row }
        if (columnName) {
          delete newRow[columnName]
        }
        return newRow
      })
      return {
        columns: newColumns,
        rows: newRows
      }
    })
  }

  const addTabularRow = () => {
    setTabularSpecs(prev => {
      const newRow = {}
      prev.columns.forEach(col => {
        newRow[col.name] = ''
      })
      return {
        ...prev,
        rows: [...prev.rows, newRow]
      }
    })
  }

  const updateTabularCell = (rowIndex, columnName, value) => {
    setTabularSpecs(prev => ({
      ...prev,
      rows: prev.rows.map((row, i) => 
        i === rowIndex ? { ...row, [columnName]: value } : row
      )
    }))
  }

  const removeTabularRow = (index) => {
    setTabularSpecs(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewDocument(prev => ({ 
        ...prev, 
        file,
        document_name: file.name.split('.')[0] // Use filename without extension as default name
      }))
    }
  }

  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target
    setNewDocument(prev => ({ ...prev, [name]: value }))
  }

  const handleDocumentUpload = async () => {
    if (!newDocument.file || !newDocument.document_name || !newDocument.document_type) {
      alert('Please fill in all document fields')
      return
    }

    if (!isEdit) {
      alert('Please save the product first before uploading documents')
      return
    }

    try {
      setDocumentLoading(true)
      await documentAPI.uploadDocument(id, newDocument)
      setNewDocument({ file: null, document_name: '', document_type: '' })
      fetchDocuments() // Refresh documents list
      alert('Document uploaded successfully!')
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setDocumentLoading(false)
    }
  }

  const handleDocumentDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      setDocumentLoading(true)
      await documentAPI.deleteDocument(id, documentId)
      fetchDocuments() // Refresh documents list
      alert('Document deleted successfully!')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    } finally {
      setDocumentLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Format specs based on format type
      let formattedSpecs = null
      
      if (specsFormat === 'tabular') {
        // Format tabular specs
        const validColumns = tabularSpecs.columns.filter(col => col.name.trim())
        formattedSpecs = {
          format: 'tabular',
          columns: validColumns.map(col => ({
            name: col.name.trim(),
            type: col.type || 'text'
          })),
          rows: tabularSpecs.rows.map(row => {
            const newRow = {}
            validColumns.forEach(col => {
              newRow[col.name.trim()] = row[col.name.trim()] || ''
            })
            return newRow
          })
        }
      } else {
        // Format key-value specs
        formattedSpecs = formData.specs
          .filter(spec => spec.key.trim()) // Remove empty specs
          .map((spec, index) => ({
            key: spec.key.trim(),
            value: spec.value.trim(),
            order: index // Add order for future use
          }))
      }
      
      const submitData = {
        ...formData,
        specs: formattedSpecs,
        images: formData.images // Include images array
      }
      
      if (isEdit) {
        await productAPI.updateProduct(id, submitData)
        // If there are new images, they will be uploaded with the update
        alert('Product updated successfully!')
      } else {
        const response = await productAPI.createProduct(submitData)
        alert('Product created successfully!')
        // Navigate to edit page for new products so documents can be uploaded
        navigate(`/admin/products/edit/${response.data.data.id}`)
        return
      }
      navigate('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Update product information' : 'Create a new product for your catalog'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.model ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., AVC-2100"
              />
              {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Auger Valve Controller"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                errors.category_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
          </div>

          <div className="mt-6">
            <label htmlFor="short_brief" className="block text-sm font-medium text-gray-700 mb-2">
              Short Brief
            </label>
            <input
              type="text"
              id="short_brief"
              name="short_brief"
              value={formData.short_brief}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of the product"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Detailed description of the product"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              id="display_order"
              name="display_order"
              value={formData.display_order}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="0"
              min="0"
            />
            <p className="mt-1 text-sm text-gray-500">Lower numbers appear first. Products are sorted by display order, then by name.</p>
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Published (visible to public)</span>
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images</h2>
          
          <div className="space-y-6">
            {/* Existing Images */}
            {isEdit && existingImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Existing Images</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                        <img
                          src={getImageUrl(image.image_url)}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Image failed to load:', image.image_url)
                            e.target.style.display = 'none'
                          }}
                        />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded z-10">
                            Primary
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(image.id)}
                            disabled={image.is_primary}
                            className={`px-3 py-1 text-xs rounded text-white shadow-lg pointer-events-auto ${
                              image.is_primary 
                                ? 'bg-gray-500 cursor-not-allowed' 
                                : 'bg-primary-600 hover:bg-primary-700'
                            }`}
                            title={image.is_primary ? 'Already primary' : 'Set as primary'}
                          >
                            {image.is_primary ? 'Primary' : 'Set Primary'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(image.id)}
                            className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white shadow-lg pointer-events-auto"
                            title="Delete image"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImageUp(index, true)}
                          disabled={index === 0}
                          className={`p-1 rounded text-xs ${
                            index === 0 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <span className="text-xs text-gray-500">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveImageDown(index, true)}
                          disabled={index === existingImages.length - 1}
                          className={`p-1 rounded text-xs ${
                            index === existingImages.length - 1 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                {isEdit ? 'Add More Images' : 'Upload Images'}
              </label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">PNG, JPG, WebP up to 10MB each. Maximum 10 images.</p>
            </div>

            {/* New Images Preview */}
            {formData.images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">New Images (will be uploaded on save)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white shadow-lg pointer-events-auto"
                            title="Remove image"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImageUp(index, false)}
                          disabled={index === 0}
                          className={`p-1 rounded text-xs ${
                            index === 0 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <span className="text-xs text-gray-500">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveImageDown(index, false)}
                          disabled={index === formData.images.length - 1}
                          className={`p-1 rounded text-xs ${
                            index === formData.images.length - 1 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Features</h2>
          
          <div className="space-y-3">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                {/* Reorder buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => moveFeatureUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded text-xs ${
                      index === 0 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeatureDown(index)}
                    disabled={index === formData.features.length - 1}
                    className={`p-1 rounded text-xs ${
                      index === formData.features.length - 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                {/* Feature input */}
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter feature"
                />
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  title="Remove feature"
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ➕ Add Feature
            </button>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Specifications</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm text-gray-700">Format:</label>
              <select
                value={specsFormat}
                onChange={(e) => {
                  setSpecsFormat(e.target.value)
                  if (e.target.value === 'tabular' && tabularSpecs.columns.length === 0) {
                    setTabularSpecs({ columns: [{ name: '', type: 'text' }], rows: [] })
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="keyvalue">Key-Value</option>
                <option value="tabular">Tabular</option>
              </select>
            </div>
          </div>
          
          {specsFormat === 'keyvalue' ? (
            // Key-Value Format Editor
            <div className="space-y-3">
              {formData.specs.map((spec, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => moveSpecUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded text-xs ${
                        index === 0 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSpecDown(index)}
                      disabled={index === formData.specs.length - 1}
                      className={`p-1 rounded text-xs ${
                        index === formData.specs.length - 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Specification inputs */}
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateSpec(index, 'key', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Specification name"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Value"
                  />
                  
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeSpec(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Remove specification"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addSpec}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ➕ Add Specification
              </button>
            </div>
          ) : (
            // Tabular Format Editor
            <div className="space-y-4">
              {/* Column Definitions */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Columns</h3>
                <div className="space-y-2">
                  {tabularSpecs.columns.map((column, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => updateTabularColumn(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Column name"
                      />
                      <select
                        value={column.type || 'text'}
                        onChange={(e) => updateTabularColumn(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="text">Text</option>
                        <option value="integer">Integer</option>
                        <option value="decimal">Decimal</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeTabularColumn(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Remove column"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTabularColumn}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ➕ Add Column
                  </button>
                </div>
              </div>

              {/* Rows Editor */}
              {tabularSpecs.columns.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">Rows</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          {tabularSpecs.columns.map((column, colIndex) => (
                            <th key={colIndex} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {column.name || `Column ${colIndex + 1}`}
                            </th>
                          ))}
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tabularSpecs.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {tabularSpecs.columns.map((column, colIndex) => (
                              <td key={colIndex} className="px-4 py-2">
                                <input
                                  type="text"
                                  value={row[column.name] || ''}
                                  onChange={(e) => updateTabularCell(rowIndex, column.name, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                              </td>
                            ))}
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => removeTabularRow(rowIndex)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded px-2 py-1"
                                title="Remove row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={addTabularRow}
                    className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ➕ Add Row
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documents Section - Only show for existing products */}
        {isEdit && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
            
            {/* Upload New Document */}
            <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-md font-medium text-gray-700 mb-3">Upload New Document</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="document_file" className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <input
                    type="file"
                    id="document_file"
                    onChange={handleDocumentFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images up to 25MB</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="document_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      id="document_name"
                      name="document_name"
                      value={newDocument.document_name}
                      onChange={handleDocumentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Product Brochure"
                    />
                  </div>

                  <div>
                    <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type *
                    </label>
                    <input
                      type="text"
                      id="document_type"
                      name="document_type"
                      value={newDocument.document_type}
                      onChange={handleDocumentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Brochure, Manual, Datasheet"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={documentLoading || !newDocument.file || !newDocument.document_name || !newDocument.document_type}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {documentLoading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>

            {/* Existing Documents */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">Existing Documents</h3>
              
              {documentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((document) => (
                        <tr key={document.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{document.file_type_icon}</span>
                              <span className="text-sm text-gray-900">{document.document_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{document.document_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{document.formatted_file_size}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(document.updated_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <a
                                href={getDocumentUrl(document.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => handleDocumentDelete(document.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📄</div>
                  <p className="text-gray-500">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
