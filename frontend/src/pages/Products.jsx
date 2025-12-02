import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productAPI, categoryAPI, productsContentAPI, getImageUrl } from '../services/api'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [engineeringServices, setEngineeringServices] = useState([])
  const [afterSalesServices, setAfterSalesServices] = useState([])
  const [industryApplications, setIndustryApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsResponse, categoriesResponse, engineeringResponse, afterSalesResponse, applicationsResponse] = await Promise.all([
        productAPI.getProducts(),
        categoryAPI.getCategories(),
        productsContentAPI.getContentByType('engineering_service'),
        productsContentAPI.getContentByType('after_sales_service'),
        productsContentAPI.getContentByType('industry_application')
      ])
      setProducts(productsResponse.data.data)
      setCategories(categoriesResponse.data.data)
      setEngineeringServices(engineeringResponse.data.data)
      setAfterSalesServices(afterSalesResponse.data.data)
      setIndustryApplications(applicationsResponse.data.data)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const scrollToCategory = (categoryId) => {
    if (categoryId === 'all') {
      // Scroll to top of products section
      const element = document.getElementById('products-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      const element = document.getElementById(`category-${categoryId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId)
    scrollToCategory(categoryId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Products</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }


  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Products & Services
            </h1>
            <p className="text-xl text-primary-100">
              Comprehensive range of desktop robots, dispensing controllers, valves, and accessories for all your automation needs
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="products-section" className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Range
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              BONDNIXS provides a one-stop services – offering dispensing solutions, expert engineering consultation, and a dedicated service team to support customers throughout the entire process.
            </p>
          </div>

          {/* Show all products grouped by category */}
          <div className="space-y-16">
            {categories.map((category) => {
              const categoryProducts = products.filter(product => product.category_id === category.id)
              if (categoryProducts.length === 0) return null
              
              return (
                <div key={category.id} id={`category-${category.id}`} className="scroll-mt-20">
                  <div className="text-center mb-12">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {category.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${encodeURIComponent(product.model)}`}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group overflow-hidden"
                      >
                        {product.primary_image_url ? (
                          <div className="w-full h-48 bg-transparent flex items-center justify-center overflow-hidden">
                            <img
                              src={getImageUrl(product.primary_image_url)}
                              alt={product.name}
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-transparent flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-4xl text-gray-400 mb-2">📦</div>
                              <p className="text-gray-500 text-sm">No image</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-primary-600 font-medium mb-3">{product.model}</p>
                          {product.short_brief && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {product.short_brief}
                            </p>
                          )}
                          
                          {product.features && product.features.length > 0 && (
                            <div className="space-y-1">
                              {product.features.slice(0, 3).map((feature, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-600 text-sm">{feature}</span>
                                </div>
                              ))}
                              {product.features.length > 3 && (
                                <p className="text-gray-500 text-xs">
                                  +{product.features.length - 3} more features
                                </p>
                              )}
                            </div>
                          )}
                          
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-500">Check back later for our latest products.</p>
            </div>
          )}
        </div>
      </section>

      {/* Engineering & System Design */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Engineering & System Design
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our expert engineering team provides comprehensive design and integration services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {engineeringServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md p-6 text-center">
                {service.image_url ? (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(service.image_url)}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                {service.description && (
                  <p className="text-gray-600">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* After-Sales Service */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              After-Sales Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive support services to keep your systems running at peak performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {afterSalesServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                {service.image_url ? (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(service.image_url)}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-4xl mb-4">🔧</div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Applications */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industry Applications
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our solutions are designed for various industrial applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {industryApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow-md p-8 text-center">
                {app.image_url ? (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(app.image_url)}
                      alt={app.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-6xl mb-4">🔧</div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{app.title}</h3>
                {app.description && (
                  <p className="text-gray-600">{app.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Contact us today for a consultation and discover how our products can optimize your operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact#contact-form" className="btn-primary">
              Request Quote
            </a>
            {/* <a href="/contact" className="btn-secondary">
              Download Brochure
            </a> */}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Products
