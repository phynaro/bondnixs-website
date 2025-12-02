import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productAPI, documentAPI, getImageUrl, getDocumentUrl, formatFileSize, getFileTypeIcon } from '../services/api'
import DownloadFormModal from '../components/DownloadFormModal'

// Helper function to detect if specs are in tabular format
function isTabularSpecs(specs) {
  if (!specs) return false
  if (Array.isArray(specs)) return false // key-value format
  if (typeof specs === 'object' && specs !== null && specs.format === 'tabular' && specs.columns && specs.rows) {
    return true
  }
  return false
}

const ProductDetail = () => {
  const { model: encodedModel } = useParams()
  const model = encodedModel ? decodeURIComponent(encodedModel) : null
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false)

  const fetchDocuments = useCallback(async (productId) => {
    try {
      setDocumentsLoading(true)
      const response = await documentAPI.getDocuments(productId)
      setDocuments(response.data.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  const fetchProduct = useCallback(async () => {
    if (!model) return
    try {
      const response = await productAPI.getProductByModel(model)
      setProduct(response.data.data)
      
      // Fetch documents for this product
      if (response.data.data.id) {
        fetchDocuments(response.data.data.id)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Product not found')
    } finally {
      setLoading(false)
    }
  }, [model, fetchDocuments])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  // Keyboard navigation for image gallery modal
  useEffect(() => {
    if (!isImageGalleryOpen || !product?.images) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsImageGalleryOpen(false)
      } else if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1)
      } else if (e.key === 'ArrowRight' && selectedImageIndex < product.images.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isImageGalleryOpen, selectedImageIndex, product?.images])

  const handleDownloadClick = (document) => {
    setSelectedDocument(document)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedDocument(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container-custom py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link to="/products" className="ml-4 text-gray-400 hover:text-gray-500">
                    Products
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">{product.name}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Product Header */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Image Gallery */}
              <div className="lg:col-span-1">
                {product.images && product.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div 
                      className="relative w-full aspect-square bg-transparent rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setIsImageGalleryOpen(true)}
                    >
                      <img
                        src={getImageUrl(product.images[selectedImageIndex].image_url)}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                      {product.images.length > 1 && (
                        <>
                          {/* Previous Button */}
                          {selectedImageIndex > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImageIndex(selectedImageIndex - 1)
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-primary-50 text-primary-700 hover:text-primary-800 shadow-lg p-2 rounded-lg transition-all duration-200 border border-gray-200 hover:border-primary-300 opacity-0 group-hover:opacity-100"
                              aria-label="Previous image"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {/* Next Button */}
                          {selectedImageIndex < product.images.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImageIndex(selectedImageIndex + 1)
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-primary-50 text-primary-700 hover:text-primary-800 shadow-lg p-2 rounded-lg transition-all duration-200 border border-gray-200 hover:border-primary-300 opacity-0 group-hover:opacity-100"
                              aria-label="Next image"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnail Strip */}
                    {product.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {product.images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === index
                                ? 'border-primary-600 ring-2 ring-primary-300'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          >
                            <img
                              src={getImageUrl(image.image_url)}
                              alt={`${product.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl text-gray-400 mb-4">📦</div>
                      <p className="text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <p className="text-xl text-primary-600 font-medium">{product.model}</p>
                </div>

                {product.short_brief && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
                    <p className="text-gray-700">{product.short_brief}</p>
                  </div>
                )}

                {product.description && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Features Section */}
          {product.features && product.features.length > 0 && (
            <div className="px-6 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <p className="text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specifications Section */}
          {product.specs && (
            (isTabularSpecs(product.specs) && product.specs.rows && product.specs.rows.length > 0) ||
            (!isTabularSpecs(product.specs) && (
              (Array.isArray(product.specs) && product.specs.length > 0) || 
              (!Array.isArray(product.specs) && Object.keys(product.specs).length > 0)
            ))
          ) && (
            <div className="px-6 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
              <div className="overflow-x-auto">
                {isTabularSpecs(product.specs) ? (
                  // Tabular format: multi-column table
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {product.specs.columns.map((column, index) => (
                          <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.specs.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {product.specs.columns.map((column, colIndex) => (
                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row[column.name] !== undefined && row[column.name] !== null ? String(row[column.name]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // Key-value format: 2-column table
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(product.specs) ? (
                        // New format: array of {key, value, order}
                        product.specs.map((spec, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {spec.key}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {spec.value}
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Old format: object
                        Object.entries(product.specs).map(([key, value]) => (
                          <tr key={key}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {key}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {value}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Downloads Section */}
          {documents.length > 0 && (
            <div className="px-6 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Downloads</h2>
              
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Download
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((document) => (
                        <tr key={document.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{document.document_type}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{document.document_name}</div>
                            <div className="text-xs text-gray-500">{document.formatted_file_size}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(document.updated_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDownloadClick(document)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Download Form Modal */}
      {selectedDocument && (
        <DownloadFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          document={selectedDocument}
          product={product}
        />
      )}

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && product.images && product.images.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setIsImageGalleryOpen(false)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                {product.images.length > 1 && (
                  <span className="text-sm text-gray-500">
                    {selectedImageIndex + 1} / {product.images.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsImageGalleryOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close gallery"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Image Container */}
            <div className="relative flex-1 flex items-center justify-center bg-gray-50 p-8 min-h-0 group">
              <img
                src={getImageUrl(product.images[selectedImageIndex].image_url)}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Navigation Buttons */}
              {product.images.length > 1 && (
                <>
                  {/* Previous Button */}
                  {selectedImageIndex > 0 && (
                    <button
                      onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                      className="absolute left-4 bg-white hover:bg-primary-50 text-primary-700 hover:text-primary-800 shadow-lg p-2 rounded-lg transition-all duration-200 border border-gray-200 hover:border-primary-300 opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {/* Next Button */}
                  {selectedImageIndex < product.images.length - 1 && (
                    <button
                      onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                      className="absolute right-4 bg-white hover:bg-primary-50 text-primary-700 hover:text-primary-800 shadow-lg p-2 rounded-lg transition-all duration-200 border border-gray-200 hover:border-primary-300 opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-primary-600 ring-2 ring-primary-300 shadow-md'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={getImageUrl(image.image_url)}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
