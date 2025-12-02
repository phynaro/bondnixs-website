import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsContentAPI } from '../../services/api'

const ProductsContentList = () => {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await productsContentAPI.getAllContentAdmin()
      setContent(response.data.data)
    } catch (error) {
      console.error('Error fetching products content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title || 'this content'}"? This action cannot be undone.`)) {
      try {
        await productsContentAPI.deleteContent(id)
        setContent(content.filter(c => c.id !== id))
        alert('Content deleted successfully')
      } catch (error) {
        console.error('Error deleting content:', error)
        alert('Failed to delete content')
      }
    }
  }

  const handleTogglePublish = async (id) => {
    try {
      const response = await productsContentAPI.togglePublish(id)
      const updatedContent = response.data.data
      
      setContent(content.map(c => 
        c.id === id ? updatedContent : c
      ))
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Failed to update publish status')
    }
  }

  const filteredContent = content.filter(item => {
    return filterType === 'all' || item.section_type === filterType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products Content</h1>
            <p className="mt-2 text-gray-600">Manage products page content sections</p>
          </div>
          <Link
            to="/admin/products-content/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add Content
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Section Type
          </label>
          <select
            id="type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="engineering_service">Engineering Service</option>
            <option value="after_sales_service">After-Sales Service</option>
            <option value="industry_application">Industry Application</option>
            <option value="hero">Hero</option>
            <option value="cta">CTA</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContent.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No content found. <Link to="/admin/products-content/new" className="text-primary-600 hover:text-primary-700">Create one</Link>
                </td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.section_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublish(item.id)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.published
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {item.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/products-content/edit/${item.id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductsContentList

