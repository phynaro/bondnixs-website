const { pool, categoryQueries, productQueries } = require('../db/pool')

async function migrateCategories() {
  const client = await pool.connect()
  
  try {
    console.log('Starting category migration...')
    
    // Check if categories already exist
    const existingCategories = await categoryQueries.getAllCategories()
    if (existingCategories.rows.length > 0) {
      console.log('Categories already exist, skipping migration')
      return
    }

    // Create default categories
    const defaultCategories = [
      {
        name: 'Desktop Robots',
        description: 'High-precision desktop dispensing robots and automation systems',
        display_order: 1
      },
      {
        name: 'Controllers',
        description: 'Valve controllers and dispensing control systems',
        display_order: 2
      },
      {
        name: 'Valves',
        description: 'Dispensing valves and valve accessories',
        display_order: 3
      },
      {
        name: 'Accessories',
        description: 'Spare parts, tools, and system accessories',
        display_order: 4
      }
    ]

    console.log('Creating default categories...')
    for (const categoryData of defaultCategories) {
      await categoryQueries.createCategory(categoryData)
      console.log(`Created category: ${categoryData.name}`)
    }

    // Get all existing products
    const products = await productQueries.getAllProductsAdmin()
    console.log(`Found ${products.rows.length} existing products`)

    // Assign products to categories based on their names/models
    const categoryMapping = {
      'Desktop Robots': ['DT-FN', 'robot', 'desktop', 'dispensing'],
      'Controllers': ['AVC', 'VC', 'controller', 'control'],
      'Valves': ['valve', 'dispensing'],
      'Accessories': ['accessory', 'part', 'tool']
    }

    for (const product of products.rows) {
      let assignedCategory = null
      
      // Find matching category based on product name/model
      for (const [categoryName, keywords] of Object.entries(categoryMapping)) {
        const productText = `${product.name} ${product.model}`.toLowerCase()
        if (keywords.some(keyword => productText.includes(keyword.toLowerCase()))) {
          assignedCategory = categoryName
          break
        }
      }

      // If no match found, assign to Controllers as default
      if (!assignedCategory) {
        assignedCategory = 'Controllers'
      }

      // Get category ID
      const categories = await categoryQueries.getAllCategories()
      const category = categories.rows.find(c => c.name === assignedCategory)
      
      if (category) {
        // Update product with category
        await productQueries.updateProduct(product.id, {
          model: product.model,
          name: product.name,
          short_brief: product.short_brief,
          description: product.description,
          image_url: product.image_url,
          features: product.features,
          specs: product.specs,
          category_id: category.id,
          published: product.published
        })
        
        console.log(`Assigned "${product.name}" to category "${assignedCategory}"`)
      }
    }

    console.log('Category migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCategories()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateCategories }
