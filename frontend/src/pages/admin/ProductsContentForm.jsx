import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productsContentAPI, getImageUrl } from '../../services/api'

const ProductsContentForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    section_type: 'engineering_service',
    title: '',
    description: '',
    content: null,
    display_order: 0,
    published: true
  })
  const [contentJson, setContentJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [existingImage, setExistingImage] = useState(null)

  useEffect(() => {
    if (isEdit) {
      fetchContent()
    }
  }, [id, isEdit])

  const fetchContent = async () => {
    try {
      const response = await productsContentAPI.getAllContentAdmin()
      const item = response.data.data.find(c => c.id === id)
      
      if (item) {
        setFormData({
          section_type: item.section_type,
          title: item.title || '',
          description: item.description || '',
          content: item.content,
          display_order: item.display_order || 0,
          published: item.published
        })
        setContentJson(item.content ? JSON.stringify(item.content, null, 2) : '')
        setExistingImage(item.image_url)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      alert('Failed to load content')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContentJsonChange = (e) => {
    setContentJson(e.target.value)
    try {
      const parsed = JSON.parse(e.target.value)
      setFormData(prev => ({ ...prev, content: parsed }))
    } catch (error) {
      // Invalid JSON, but we'll validate on submit
    }
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Parse JSON content if provided
    let parsedContent = null
    if (contentJson.trim()) {
      try {
        parsedContent = JSON.parse(contentJson)
      } catch (error) {
        alert('Invalid JSON format in content field')
        setLoading(false)
        return
      }
    }

    const submitData = {
      ...formData,
      content: parsedContent,
      image: image
    }

    try {
      if (isEdit) {
        await productsContentAPI.updateContent(id, submitData)
        alert('Content updated successfully')
      } else {
        await productsContentAPI.createContent(submitData)
        alert('Content created successfully')
      }
      navigate('/admin/products-content')
    } catch (error) {
      console.error('Error saving content:', error)
      alert(error.response?.data?.message || 'Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Products Content' : 'Create Products Content'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Update products page content section' : 'Add new products page content section'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="section_type" className="block text-sm font-medium text-gray-700 mb-2">
                Section Type *
              </label>
              <select
                id="section_type"
                name="section_type"
                value={formData.section_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="engineering_service">Engineering Service</option>
                <option value="after_sales_service">After-Sales Service</option>
                <option value="industry_application">Industry Application</option>
              </select>
            </div>

            <div>
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
              />
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Content title"
            />
          </div>

          <div>
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
              placeholder="Content description"
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            {existingImage && !image && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img
                  src={getImageUrl(existingImage)}
                  alt="Current content"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
            {image && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">New image preview:</p>
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content (JSON)
            </label>
            <textarea
              id="content"
              value={contentJson}
              onChange={handleContentJsonChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder='{"key": "value"}'
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter JSON content for flexible data (optional)
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Published</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/products-content')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Content' : 'Create Content'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProductsContentForm

