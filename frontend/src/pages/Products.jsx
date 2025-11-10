import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productAPI, categoryAPI, getImageUrl } from '../services/api'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productAPI.getProducts(),
        categoryAPI.getCategories()
      ])
      setProducts(productsResponse.data.data)
      setCategories(categoriesResponse.data.data)
      
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

  const applications = [
    {
      name: "Potting",
      description: "Protective potting applications for electronic components",
      icon: "🔧"
    },
    {
      name: "Conformal Coating", 
      description: "Protective coating applications for circuit boards",
      icon: "🛡️"
    },
    {
      name: "Solder Paste",
      description: "Precise solder paste dispensing for PCB assembly",
      icon: "⚡"
    }
  ]

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
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
                      >
                        {product.image_url ? (
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
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
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Drawing</h3>
              <p className="text-gray-600">Professional technical drawings and specifications for your projects</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Part Fabrication</h3>
              <p className="text-gray-600">Custom parts and components manufactured to your specifications</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">System Integration</h3>
              <p className="text-gray-600">Complete system integration and optimization for maximum efficiency</p>
            </div>
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
            {[
              { name: "Maintenance", icon: "🔧" },
              { name: "Troubleshooting", icon: "🔍" },
              { name: "Overhaul", icon: "⚙️" },
              { name: "Upgrade Systems", icon: "⬆️" },
              { name: "Spare Parts", icon: "🔩" }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
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
            {applications.map((app, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-6xl mb-4">{app.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{app.name}</h3>
                <p className="text-gray-600">{app.description}</p>
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
            <a href="/contact" className="btn-secondary">
              Download Brochure
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Products
