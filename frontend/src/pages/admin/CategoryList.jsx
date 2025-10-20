import { useState, useEffect } from 'react'
import { categoryAPI } from '../../services/api'

const CategoryList = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    display_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setEditingData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order
    })
  }

  const handleSaveEdit = async () => {
    try {
      await categoryAPI.updateCategory(editingId, editingData)
      await fetchCategories()
      setEditingId(null)
      setEditingData({})
      alert('Category updated successfully')
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData({})
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await categoryAPI.deleteCategory(id)
        await fetchCategories()
        alert('Category deleted successfully')
      } catch (error) {
        console.error('Error deleting category:', error)
        if (error.response?.data?.message) {
          alert(error.response.data.message)
        } else {
          alert('Failed to delete category')
        }
      }
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      await categoryAPI.createCategory(newCategory)
      await fetchCategories()
      setNewCategory({ name: '', description: '', display_order: 0 })
      setShowAddForm(false)
      alert('Category created successfully')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    }
  }

  const handleReorder = async (id, newOrder) => {
    try {
      await categoryAPI.updateCategoryOrder(id, newOrder)
      await fetchCategories()
    } catch (error) {
      console.error('Error updating category order:', error)
      alert('Failed to update category order')
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="mt-2 text-gray-600">Manage product categories</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Desktop Robots"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Category description"
                  />
                </div>
                <div>
                  <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="display_order"
                    value={newCategory.display_order}
                    onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
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
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === category.id ? (
                        <input
                          type="number"
                          value={editingData.display_order}
                          onChange={(e) => setEditingData({ ...editingData, display_order: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{category.display_order}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === category.id ? (
                        <input
                          type="text"
                          value={editingData.name}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === category.id ? (
                        <input
                          type="text"
                          value={editingData.description}
                          onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{category.description || 'No description'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === category.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first category.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Category
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryList
