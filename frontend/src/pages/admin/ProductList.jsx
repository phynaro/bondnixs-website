import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productAPI, categoryAPI, getImageUrl } from '../../services/api'

const ProductList = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAllProductsAdmin()
      setProducts(response.data.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await productAPI.deleteProduct(id)
        setProducts(products.filter(p => p.id !== id))
        alert('Product deleted successfully')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      }
    }
  }

  const handleTogglePublish = async (id) => {
    try {
      const response = await productAPI.togglePublish(id)
      const updatedProduct = response.data.data
      
      setProducts(products.map(p => 
        p.id === id ? updatedProduct : p
      ))
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Failed to update publish status')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.model.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && product.published) ||
                         (filterStatus === 'unpublished' && !product.published)
    
    const matchesCategory = filterCategory === 'all' || 
                           product.category_id === filterCategory
    
    return matchesSearch && matchesStatus && matchesCategory
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
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-gray-600">Manage your product catalog</p>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or model..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Products</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                id="category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredProducts.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.primary_image_url ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover mr-4"
                              src={getImageUrl(product.primary_image_url)}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-4">
                              <span className="text-gray-400">📦</span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.short_brief && (
                              <div className="text-sm text-gray-500">
                                {product.short_brief}
                              </div>
                            )}
                            {product.images && product.images.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-400">
                                  {product.images.length} image{product.images.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex -space-x-1 ml-2">
                                  {product.images.slice(0, 3).map((img, idx) => (
                                    <img
                                      key={img.id}
                                      src={getImageUrl(img.image_url)}
                                      alt={`${product.name} ${idx + 1}`}
                                      className="h-6 w-6 rounded border border-white object-cover"
                                      title={img.is_primary ? 'Primary' : ''}
                                    />
                                  ))}
                                  {product.images.length > 3 && (
                                    <div className="h-6 w-6 rounded border border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                      +{product.images.length - 3}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category_name || 'No category'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(product.id)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            product.published
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {product.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.document_count > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.document_count} docs
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No docs</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
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

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1">
                        {product.primary_image_url ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover mr-3"
                            src={getImageUrl(product.primary_image_url)}
                            alt={product.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-400 text-lg">📦</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {product.model}
                          </p>
                          {product.images && product.images.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-gray-400">
                                {product.images.length} image{product.images.length !== 1 ? 's' : ''}
                              </span>
                              <div className="flex -space-x-1 ml-2">
                                {product.images.slice(0, 3).map((img, idx) => (
                                  <img
                                    key={img.id}
                                    src={getImageUrl(img.image_url)}
                                    alt={`${product.name} ${idx + 1}`}
                                    className="h-5 w-5 rounded border border-white object-cover"
                                    title={img.is_primary ? 'Primary' : ''}
                                  />
                                ))}
                                {product.images.length > 3 && (
                                  <div className="h-5 w-5 rounded border border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    +{product.images.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePublish(product.id)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                          product.published
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {product.published ? 'Published' : 'Draft'}
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-2 mb-3">
                      {product.short_brief && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {product.short_brief}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Category: {product.category_name || 'No category'}</span>
                        <span>{new Date(product.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        {product.document_count > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.document_count} documents
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No documents</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-sm text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first product.'
              }
            </p>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductList
