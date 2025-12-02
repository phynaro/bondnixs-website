import { useState, useEffect } from 'react'
import { solutionsContentAPI, getImageUrl } from '../services/api'

const Solutions = () => {
  const [heroContent, setHeroContent] = useState(null)
  const [solutions, setSolutions] = useState([])
  const [caseStudies, setCaseStudies] = useState([])
  const [processSteps, setProcessSteps] = useState([])
  const [benefits, setBenefits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const [heroResponse, solutionsResponse, caseStudiesResponse, processResponse, benefitsResponse] = await Promise.all([
        solutionsContentAPI.getContentByType('hero'),
        solutionsContentAPI.getContentByType('industry_solution'),
        solutionsContentAPI.getContentByType('case_study'),
        solutionsContentAPI.getContentByType('process_step'),
        solutionsContentAPI.getContentByType('benefit')
      ])
      
      if (heroResponse.data.data.length > 0) {
        setHeroContent(heroResponse.data.data[0])
      }
      setSolutions(solutionsResponse.data.data)
      setCaseStudies(caseStudiesResponse.data.data)
      setProcessSteps(processResponse.data.data)
      setBenefits(benefitsResponse.data.data)
    } catch (error) {
      console.error('Error fetching solutions content:', error)
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {heroContent?.title || 'Industry Solutions'}
            </h1>
            <p className="text-xl text-primary-100">
              {heroContent?.description || 'Tailored dispensing solutions for various industries and applications'}
            </p>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industry-Specific Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the unique challenges of different industries and provide customized solutions to meet specific requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution) => (
              <div key={solution.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    {solution.image_url && (
                      <img
                        src={getImageUrl(solution.image_url)}
                        alt={solution.title}
                        className="w-16 h-16 object-cover rounded-lg mr-4"
                      />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{solution.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">{solution.description}</p>
                  {solution.content?.features && (
                    <ul className="space-y-2">
                      {solution.content.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-world examples of how we've helped our clients achieve their goals
            </p>
          </div>

          <div className="space-y-12">
            {caseStudies.map((study) => (
              <div key={study.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{study.title}</h3>
                      <p className="text-gray-600 mb-4">{study.description}</p>
                      {study.content?.industry && (
                        <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                          {study.content.industry}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {study.content?.results && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {study.content.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-primary-600 mb-1">
                            {result.split(' ')[0]}
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.split(' ').slice(1).join(' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Solution Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach to delivering the right solution for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((process) => (
              <div key={process.id} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {process.content?.step || '01'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{process.title}</h3>
                <p className="text-gray-600">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Solutions?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive benefits that deliver real value to your operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="bg-white rounded-lg shadow-md p-8 text-center">
                {benefit.image_url && (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
                    <img
                      src={getImageUrl(benefit.image_url)}
                      alt={benefit.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Let us help you find the perfect solution for your specific needs and challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact#contact-form" className="btn-primary">
              Request Consultation
            </a>
            <a href="/contact" className="btn-secondary">
              Download Case Studies
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Solutions
