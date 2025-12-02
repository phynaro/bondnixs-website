const { Pool } = require('pg')

// Database configuration from environment variables
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'bondnixs_dev',
  user: process.env.POSTGRES_USER || 'bondnixs_dev',
  password: process.env.POSTGRES_PASSWORD || 'devpassword123',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Query helper function
const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    //console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Category-specific query functions
const categoryQueries = {
  // Get all categories
  getAllCategories: () => query(`
    SELECT id, name, description, display_order, created_at, updated_at
    FROM category 
    ORDER BY display_order ASC, name ASC
  `),

  // Get category by ID
  getCategoryById: (id) => query(`
    SELECT * FROM category WHERE id = $1
  `, [id]),

  // Create new category
  createCategory: (categoryData) => query(`
    INSERT INTO category (name, description, display_order)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [
    categoryData.name,
    categoryData.description,
    categoryData.display_order
  ]),

  // Update category
  updateCategory: (id, categoryData) => query(`
    UPDATE category 
    SET name = $2, description = $3, display_order = $4, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    categoryData.name,
    categoryData.description,
    categoryData.display_order
  ]),

  // Delete category
  deleteCategory: (id) => query(`
    DELETE FROM category WHERE id = $1
  `, [id]),

  // Check if category has products
  getCategoryProductCount: (id) => query(`
    SELECT COUNT(*) as count FROM product WHERE category_id = $1
  `, [id]),

  // Get products grouped by category
  getProductsGroupedByCategory: () => query(`
    SELECT 
      c.id as category_id,
      c.name as category_name,
      c.description as category_description,
      c.display_order,
      json_agg(
        json_build_object(
          'id', p.id,
          'model', p.model,
          'name', p.name,
          'short_brief', p.short_brief,
          'description', p.description,
          'image_url', p.image_url,
          'features', p.features,
          'specs', p.specs,
          'published', p.published,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        ) ORDER BY p.created_at DESC
      ) as products
    FROM category c
    LEFT JOIN product p ON c.id = p.category_id AND p.published = true
    GROUP BY c.id, c.name, c.description, c.display_order
    ORDER BY c.display_order ASC, c.name ASC
  `)
}

// Product-specific query functions
const productQueries = {
  // Get all published products with category info and primary image
  getAllProducts: () => query(`
    SELECT 
      p.id, p.model, p.name, p.short_brief, p.description, 
      p.features, p.specs, p.published, p.created_at, p.updated_at,
      c.id as category_id, c.name as category_name, c.description as category_description,
      pi.image_url as primary_image_url
    FROM product p
    JOIN category c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
    WHERE p.published = true 
    ORDER BY c.display_order ASC, p.created_at DESC
  `),

  // Get product by model with category info and all images
  getProductByModel: (model) => query(`
    SELECT 
      p.*,
      c.id as category_id, c.name as category_name, c.description as category_description
    FROM product p
    JOIN category c ON p.category_id = c.id
    WHERE p.model = $1
  `, [model]),

  // Get product by ID with category info and all images
  getProductById: (id) => query(`
    SELECT 
      p.*,
      c.id as category_id, c.name as category_name, c.description as category_description
    FROM product p
    JOIN category c ON p.category_id = c.id
    WHERE p.id = $1
  `, [id]),

  // Get all products (including unpublished) - for admin
  getAllProductsAdmin: () => query(`
    SELECT 
      p.id, p.model, p.name, p.short_brief, p.description, 
      p.features, p.specs, p.published, p.created_at, p.updated_at,
      c.id as category_id, c.name as category_name, c.description as category_description,
      COALESCE(doc_counts.document_count, 0) as document_count,
      pi.image_url as primary_image_url
    FROM product p
    JOIN category c ON p.category_id = c.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) as document_count
      FROM product_documents
      GROUP BY product_id
    ) doc_counts ON p.id = doc_counts.product_id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
    ORDER BY c.display_order ASC, p.created_at DESC
  `),

  // Create new product
  createProduct: (productData) => query(`
    INSERT INTO product (model, name, short_brief, description, features, specs, category_id, published)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    productData.model,
    productData.name,
    productData.short_brief,
    productData.description,
    productData.features,
    productData.specs,
    productData.category_id,
    productData.published
  ]),

  // Update product
  updateProduct: (id, productData) => query(`
    UPDATE product 
    SET model = $2, name = $3, short_brief = $4, description = $5, 
        features = $6, specs = $7, category_id = $8, published = $9, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    productData.model,
    productData.name,
    productData.short_brief,
    productData.description,
    productData.features,
    productData.specs,
    productData.category_id,
    productData.published
  ]),

  // Delete product
  deleteProduct: (id) => query(`
    DELETE FROM product WHERE id = $1
  `, [id]),

  // Toggle publish status
  togglePublish: (id) => query(`
    UPDATE product 
    SET published = NOT published, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [id]),

  // Search products
  searchProducts: (searchTerm) => query(`
    SELECT 
      p.*,
      c.id as category_id, c.name as category_name, c.description as category_description
    FROM product p
    JOIN category c ON p.category_id = c.id
    WHERE p.published = true AND (
      to_tsvector('simple', p.name || ' ' || coalesce(p.description,''))
      @@ plainto_tsquery('simple', $1)
      OR p.model ILIKE $2
    )
    ORDER BY p.created_at DESC
  `, [searchTerm, `%${searchTerm}%`])
}

// Document-specific query functions
const documentQueries = {
  // Get all documents for a product
  getDocumentsByProductId: (productId) => query(`
    SELECT id, document_name, document_type, file_url, file_size, uploaded_at, updated_at
    FROM product_documents 
    WHERE product_id = $1 
    ORDER BY uploaded_at DESC
  `, [productId]),

  // Get document by ID
  getDocumentById: (documentId) => query(`
    SELECT * FROM product_documents WHERE id = $1
  `, [documentId]),

  // Create new document
  createDocument: (documentData) => query(`
    INSERT INTO product_documents (product_id, document_name, document_type, file_url, file_size)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    documentData.product_id,
    documentData.document_name,
    documentData.document_type,
    documentData.file_url,
    documentData.file_size
  ]),

  // Update document metadata
  updateDocument: (documentId, documentData) => query(`
    UPDATE product_documents 
    SET document_name = $2, document_type = $3, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    documentId,
    documentData.document_name,
    documentData.document_type
  ]),

  // Delete document
  deleteDocument: (documentId) => query(`
    DELETE FROM product_documents WHERE id = $1
  `, [documentId]),

  // Get document count for a product
  getDocumentCountByProductId: (productId) => query(`
    SELECT COUNT(*) as count FROM product_documents WHERE product_id = $1
  `, [productId]),

  // Get all products with document counts (for admin list)
  getProductsWithDocumentCounts: () => query(`
    SELECT 
      p.id, p.model, p.name, p.short_brief, p.description, p.image_url, 
      p.features, p.specs, p.published, p.created_at, p.updated_at,
      c.id as category_id, c.name as category_name, c.description as category_description,
      COALESCE(doc_counts.document_count, 0) as document_count
    FROM product p
    JOIN category c ON p.category_id = c.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) as document_count
      FROM product_documents
      GROUP BY product_id
    ) doc_counts ON p.id = doc_counts.product_id
    ORDER BY c.display_order ASC, p.created_at DESC
  `)
}

// File storage query functions
const fileStorageQueries = {
  // Get all files
  getAllFiles: () => query(`
    SELECT id, filename, original_name, file_url, file_size, mime_type, description, 
           uploaded_by, uploaded_by_name, uploaded_at, updated_at
    FROM file_storage 
    ORDER BY uploaded_at DESC
  `),

  // Get file by ID
  getFileById: (id) => query(`
    SELECT * FROM file_storage WHERE id = $1
  `, [id]),

  // Create new file record
  createFile: (fileData) => query(`
    INSERT INTO file_storage (filename, original_name, file_url, file_size, mime_type, description, uploaded_by, uploaded_by_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    fileData.filename,
    fileData.original_name,
    fileData.file_url,
    fileData.file_size,
    fileData.mime_type,
    fileData.description || null,
    fileData.uploaded_by,
    fileData.uploaded_by_name || null
  ]),

  // Update file metadata
  updateFile: (id, fileData) => query(`
    UPDATE file_storage 
    SET description = $2, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    fileData.description || null
  ]),

  // Delete file
  deleteFile: (id) => query(`
    DELETE FROM file_storage WHERE id = $1
  `, [id]),

  // Get file activities
  getFileActivities: (fileId) => query(`
    SELECT id, file_id, activity_type, performed_by, performed_by_name, performed_at, details
    FROM file_activities 
    WHERE file_id = $1 
    ORDER BY performed_at DESC
  `, [fileId]),

  // Create file activity
  createFileActivity: (activityData) => {
    const detailsValue = activityData.details ? JSON.stringify(activityData.details) : null
    return query(`
      INSERT INTO file_activities (file_id, activity_type, performed_by, performed_by_name, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      activityData.file_id,
      activityData.activity_type,
      activityData.performed_by,
      activityData.performed_by_name || null,
      detailsValue
    ])
  }
}

// Home content query functions
const homeContentQueries = {
  // Get all published home content
  getAllContent: () => query(`
    SELECT * FROM home_content 
    WHERE published = true 
    ORDER BY display_order ASC, created_at DESC
  `),

  // Get content by section type (published only)
  getContentByType: (sectionType) => query(`
    SELECT * FROM home_content 
    WHERE section_type = $1 AND published = true 
    ORDER BY display_order ASC, created_at DESC
  `, [sectionType]),

  // Get all content (including unpublished) - for admin
  getAllContentAdmin: () => query(`
    SELECT * FROM home_content 
    ORDER BY section_type ASC, display_order ASC, created_at DESC
  `),

  // Get content by ID
  getContentById: (id) => query(`
    SELECT * FROM home_content WHERE id = $1
  `, [id]),

  // Create new content
  createContent: (contentData) => query(`
    INSERT INTO home_content (section_type, title, subtitle, description, image_url, content, display_order, published)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    contentData.section_type,
    contentData.title || null,
    contentData.subtitle || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Update content
  updateContent: (id, contentData) => query(`
    UPDATE home_content 
    SET section_type = $2, title = $3, subtitle = $4, description = $5, image_url = $6,
        content = $7, display_order = $8, published = $9, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    contentData.section_type,
    contentData.title || null,
    contentData.subtitle || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Delete content
  deleteContent: (id) => query(`
    DELETE FROM home_content WHERE id = $1
  `, [id]),

  // Toggle publish status
  togglePublish: (id) => query(`
    UPDATE home_content 
    SET published = NOT published, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [id])
}

// Solutions content query functions
const solutionsContentQueries = {
  // Get all published solutions content
  getAllContent: () => query(`
    SELECT * FROM solutions_content 
    WHERE published = true 
    ORDER BY display_order ASC, created_at DESC
  `),

  // Get content by type (published only)
  getContentByType: (contentType) => query(`
    SELECT * FROM solutions_content 
    WHERE content_type = $1 AND published = true 
    ORDER BY display_order ASC, created_at DESC
  `, [contentType]),

  // Get all content (including unpublished) - for admin
  getAllContentAdmin: () => query(`
    SELECT * FROM solutions_content 
    ORDER BY content_type ASC, display_order ASC, created_at DESC
  `),

  // Get content by ID
  getContentById: (id) => query(`
    SELECT * FROM solutions_content WHERE id = $1
  `, [id]),

  // Create new content
  createContent: (contentData) => query(`
    INSERT INTO solutions_content (content_type, title, description, image_url, content, display_order, published)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    contentData.content_type,
    contentData.title || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Update content
  updateContent: (id, contentData) => query(`
    UPDATE solutions_content 
    SET content_type = $2, title = $3, description = $4, image_url = $5, 
        content = $6, display_order = $7, published = $8, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    contentData.content_type,
    contentData.title || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Delete content
  deleteContent: (id) => query(`
    DELETE FROM solutions_content WHERE id = $1
  `, [id]),

  // Toggle publish status
  togglePublish: (id) => query(`
    UPDATE solutions_content 
    SET published = NOT published, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [id])
}

// About content query functions
const aboutContentQueries = {
  // Get all published about content
  getAllContent: () => query(`
    SELECT * FROM about_content 
    WHERE published = true 
    ORDER BY display_order ASC, created_at DESC
  `),

  // Get content by section type (published only)
  getContentByType: (sectionType) => query(`
    SELECT * FROM about_content 
    WHERE section_type = $1 AND published = true 
    ORDER BY display_order ASC, created_at DESC
  `, [sectionType]),

  // Get all content (including unpublished) - for admin
  getAllContentAdmin: () => query(`
    SELECT * FROM about_content 
    ORDER BY section_type ASC, display_order ASC, created_at DESC
  `),

  // Get content by ID
  getContentById: (id) => query(`
    SELECT * FROM about_content WHERE id = $1
  `, [id]),

  // Create new content
  createContent: (contentData) => query(`
    INSERT INTO about_content (section_type, title, description, image_url, content, display_order, published)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    contentData.section_type,
    contentData.title || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Update content
  updateContent: (id, contentData) => query(`
    UPDATE about_content 
    SET section_type = $2, title = $3, description = $4, image_url = $5, 
        content = $6, display_order = $7, published = $8, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    contentData.section_type,
    contentData.title || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Delete content
  deleteContent: (id) => query(`
    DELETE FROM about_content WHERE id = $1
  `, [id]),

  // Toggle publish status
  togglePublish: (id) => query(`
    UPDATE about_content 
    SET published = NOT published, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [id])
}

// Products content query functions
const productsContentQueries = {
  // Get all published products content
  getAllContent: () => query(`
    SELECT * FROM products_content 
    WHERE published = true 
    ORDER BY display_order ASC, created_at DESC
  `),

  // Get content by type (published only)
  getContentByType: (sectionType) => query(`
    SELECT * FROM products_content 
    WHERE section_type = $1 AND published = true 
    ORDER BY display_order ASC, created_at DESC
  `, [sectionType]),

  // Get all content (including unpublished) - for admin
  getAllContentAdmin: () => query(`
    SELECT * FROM products_content 
    ORDER BY section_type ASC, display_order ASC, created_at DESC
  `),

  // Get content by ID
  getContentById: (id) => query(`
    SELECT * FROM products_content WHERE id = $1
  `, [id]),

  // Create new content
  createContent: (contentData) => query(`
    INSERT INTO products_content (section_type, title, description, image_url, content, display_order, published)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    contentData.section_type,
    contentData.title || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Update content
  updateContent: (id, contentData) => query(`
    UPDATE products_content 
    SET section_type = $2, title = $3, description = $4, image_url = $5, 
        content = $6, display_order = $7, published = $8, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    contentData.section_type,
    contentData.title || null,
    contentData.description || null,
    contentData.image_url || null,
    contentData.content ? JSON.stringify(contentData.content) : null,
    contentData.display_order || 0,
    contentData.published !== undefined ? contentData.published : true
  ]),

  // Delete content
  deleteContent: (id) => query(`
    DELETE FROM products_content WHERE id = $1
  `, [id]),

  // Toggle publish status
  togglePublish: (id) => query(`
    UPDATE products_content 
    SET published = NOT published, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [id])
}

// Contact FAQ query functions
const contactFaqQueries = {
  // Get all published FAQs
  getFaqs: () => query(`
    SELECT * FROM contact_faq 
    WHERE published = true 
    ORDER BY display_order ASC, created_at DESC
  `),

  // Get all FAQs (including unpublished) - for admin
  getAllFaqsAdmin: () => query(`
    SELECT * FROM contact_faq 
    ORDER BY display_order ASC, created_at DESC
  `),

  // Get FAQ by ID
  getFaqById: (id) => query(`
    SELECT * FROM contact_faq WHERE id = $1
  `, [id]),

  // Create new FAQ
  createFaq: (faqData) => query(`
    INSERT INTO contact_faq (question, answer, display_order, published)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [
    faqData.question,
    faqData.answer,
    faqData.display_order || 0,
    faqData.published !== undefined ? faqData.published : true
  ]),

  // Update FAQ
  updateFaq: (id, faqData) => query(`
    UPDATE contact_faq 
    SET question = $2, answer = $3, display_order = $4, published = $5, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    faqData.question,
    faqData.answer,
    faqData.display_order || 0,
    faqData.published !== undefined ? faqData.published : true
  ]),

  // Delete FAQ
  deleteFaq: (id) => query(`
    DELETE FROM contact_faq WHERE id = $1
  `, [id]),

  // Toggle publish status
  togglePublish: (id) => query(`
    UPDATE contact_faq 
    SET published = NOT published, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [id])
}

// Product image-specific query functions
const productImageQueries = {
  // Get all images for a product ordered by display_order
  getImagesByProductId: (productId) => query(`
    SELECT id, product_id, image_url, display_order, is_primary, created_at, updated_at
    FROM product_images 
    WHERE product_id = $1 
    ORDER BY display_order ASC, created_at ASC
  `, [productId]),

  // Get primary image for a product
  getPrimaryImageByProductId: (productId) => query(`
    SELECT id, product_id, image_url, display_order, is_primary, created_at, updated_at
    FROM product_images 
    WHERE product_id = $1 AND is_primary = TRUE
    LIMIT 1
  `, [productId]),

  // Create new image
  createImage: (imageData) => query(`
    INSERT INTO product_images (product_id, image_url, display_order, is_primary)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [
    imageData.product_id,
    imageData.image_url,
    imageData.display_order || 0,
    imageData.is_primary || false
  ]),

  // Update image metadata
  updateImage: (id, imageData) => query(`
    UPDATE product_images 
    SET display_order = $2, is_primary = $3, updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id,
    imageData.display_order,
    imageData.is_primary
  ]),

  // Delete image
  deleteImage: (id) => query(`
    DELETE FROM product_images WHERE id = $1
  `, [id]),

  // Set an image as primary (unset others for the same product)
  setPrimaryImage: (productId, imageId) => query(`
    WITH updated AS (
      UPDATE product_images 
      SET is_primary = CASE WHEN id = $2 THEN TRUE ELSE FALSE END,
          updated_at = now()
      WHERE product_id = $1
      RETURNING *
    )
    SELECT * FROM updated WHERE id = $2
  `, [productId, imageId]),

  // Reorder images (accepts array of {id, display_order})
  reorderImages: async (productId, imageOrders) => {
    // Use a transaction to update multiple images
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      for (const order of imageOrders) {
        await client.query(`
          UPDATE product_images 
          SET display_order = $1, updated_at = now()
          WHERE id = $2 AND product_id = $3
        `, [order.display_order, order.id, productId])
      }
      
      await client.query('COMMIT')
      
      // Return updated images
      return await query(`
        SELECT * FROM product_images 
        WHERE product_id = $1 
        ORDER BY display_order ASC
      `, [productId])
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Get image by ID
  getImageById: (id) => query(`
    SELECT * FROM product_images WHERE id = $1
  `, [id])
}

module.exports = {
  pool,
  query,
  categoryQueries,
  productQueries,
  productImageQueries,
  documentQueries,
  fileStorageQueries,
  homeContentQueries,
  solutionsContentQueries,
  aboutContentQueries,
  productsContentQueries,
  contactFaqQueries
}
