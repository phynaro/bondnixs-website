import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { homeContentAPI, getImageUrl } from '../services/api'

const Home = () => {
  const [heroContent, setHeroContent] = useState(null)
  const [features, setFeatures] = useState([])
  const [productPreviews, setProductPreviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const [heroResponse, featuresResponse, previewsResponse] = await Promise.all([
        homeContentAPI.getContentByType('hero'),
        homeContentAPI.getContentByType('feature'),
        homeContentAPI.getContentByType('product_preview')
      ])
      
      if (heroResponse.data.data.length > 0) {
        setHeroContent(heroResponse.data.data[0])
      }
      setFeatures(featuresResponse.data.data)
      setProductPreviews(previewsResponse.data.data)
    } catch (error) {
      console.error('Error fetching home content:', error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {heroContent?.title || 'Founded by Dispensing Expert Engineers'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              {heroContent?.subtitle || 'BONDNIXS CO., LTD. is a specialized engineering and distribution company founded by dispensing expert engineers focusing on desktop robot and dispensing solutions.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {heroContent?.content?.cta_primary ? (
                <Link to={heroContent.content.cta_primary.link} className="btn-primary">
                  {heroContent.content.cta_primary.text}
                </Link>
              ) : (
                <Link to="/contact" className="btn-primary">
                  Contact Us
                </Link>
              )}
              {heroContent?.content?.cta_secondary ? (
                <Link to={heroContent.content.cta_secondary.link} className="btn-secondary">
                  {heroContent.content.cta_secondary.text}
                </Link>
              ) : (
                <Link to="/products" className="btn-secondary">
                  Learn More
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          {features.length > 0 && features[0].title && (
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {features[0].title}
              </h2>
              {features[0].subtitle && (
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {features[0].subtitle}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={feature.id || index} className="text-center p-6 bg-white rounded-lg shadow-md">
                {feature.image_url && (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(feature.image_url)}
                      alt={feature.description || feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{feature.description || feature.title}</h3>
                <p className="text-gray-600">{feature.content?.description || feature.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-20">
        <div className="container-custom">
          {productPreviews.length > 0 && productPreviews[0].title && (
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {productPreviews[0].title}
              </h2>
              {productPreviews[0].subtitle && (
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {productPreviews[0].subtitle}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {productPreviews.map((preview, index) => {
              const gradient = preview.content?.gradient || 'from-primary-400 to-primary-600'
              return (
                <div key={preview.id || index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                    {preview.image_url ? (
                      <img
                        src={getImageUrl(preview.image_url)}
                        alt={preview.description || preview.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{preview.description || preview.title}</h3>
                    <p className="text-gray-600 mb-4">{preview.content?.description || preview.subtitle}</p>
                    {preview.content?.link ? (
                      <Link to={preview.content.link} className="text-primary-600 hover:text-primary-700 font-medium">
                        {preview.content.linkText || 'Learn More →'}
                      </Link>
                    ) : (
                      <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium">
                        Learn More →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-900 to-primary-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Contact us today for a consultation and discover how BONDNIXS can help optimize your dispensing operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact#contact-form" className="btn-primary">
              Request Quote
            </Link>
            <Link to="/products" className="btn-secondary">
              View Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
