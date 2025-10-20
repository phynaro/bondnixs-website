const express = require('express')
const router = express.Router()
const { categoryQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

// Public routes

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await categoryQueries.getAllCategories()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    })
  }
})

// Get products grouped by category
router.get('/products', async (req, res) => {
  try {
    const result = await categoryQueries.getProductsGroupedByCategory()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category'
    })
  }
})

// Admin routes (protected)

// Create new category - Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, display_order } = req.body
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      })
    }

    const categoryData = {
      name: name.trim(),
      description: description || null,
      display_order: display_order || 0
    }

    const result = await categoryQueries.createCategory(categoryData)
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Category created successfully'
    })
  } catch (error) {
    console.error('Error creating category:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Category name already exists'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create category'
      })
    }
  }
})

// Update category - Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, display_order } = req.body

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      })
    }

    // Check if category exists
    const existingResult = await categoryQueries.getCategoryById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    const categoryData = {
      name: name.trim(),
      description: description || null,
      display_order: display_order || 0
    }

    const result = await categoryQueries.updateCategory(id, categoryData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Category name already exists'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update category'
      })
    }
  }
})

// Delete category - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if category exists
    const existingResult = await categoryQueries.getCategoryById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    // Check if category has products
    const productCountResult = await categoryQueries.getCategoryProductCount(id)
    const productCount = parseInt(productCountResult.rows[0].count)
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${productCount} product(s). Please move or delete the products first.`
      })
    }

    // Delete category
    await categoryQueries.deleteCategory(id)

    res.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    })
  }
})

// Update category display order - Admin only
router.patch('/:id/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { display_order } = req.body

    if (typeof display_order !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Display order must be a number'
      })
    }

    // Check if category exists
    const existingResult = await categoryQueries.getCategoryById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    const categoryData = {
      name: existingResult.rows[0].name,
      description: existingResult.rows[0].description,
      display_order: display_order
    }

    const result = await categoryQueries.updateCategory(id, categoryData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Category order updated successfully'
    })
  } catch (error) {
    console.error('Error updating category order:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update category order'
    })
  }
})

module.exports = router
