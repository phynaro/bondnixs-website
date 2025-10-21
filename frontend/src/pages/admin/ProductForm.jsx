import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productAPI, categoryAPI, documentAPI, getImageUrl, getDocumentUrl, formatFileSize, getFileTypeIcon } from '../../services/api'

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
    image: null
  })
  const [existingImage, setExistingImage] = useState(null)
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
      const product = response.data.data.find(p => p.id === id)
      
      if (product) {
        // Convert specs to array for ordered display
        // Handle both old format (object) and new format (array)
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
          image: null
        })
        setExistingImage(product.image_url)
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
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
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
      // Convert specs array to ordered array for API (preserves order)
      const specsArray = formData.specs
        .filter(spec => spec.key.trim()) // Remove empty specs
        .map((spec, index) => ({
          key: spec.key.trim(),
          value: spec.value.trim(),
          order: index // Add order for future use
        }))
      
      const submitData = {
        ...formData,
        specs: specsArray
      }
      
      if (isEdit) {
        await productAPI.updateProduct(id, submitData)
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Image</h2>
          
          <div className="space-y-4">
            {existingImage && !formData.image && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img
                  src={getImageUrl(existingImage)}
                  alt="Current product"
                  className="h-32 w-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                {isEdit ? 'Change Image' : 'Upload Image'}
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">PNG, JPG, WebP up to 5MB</p>
            </div>

            {formData.image && (
              <div>
                <p className="text-sm text-gray-600 mb-2">New image preview:</p>
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg"
                />
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>
          
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
