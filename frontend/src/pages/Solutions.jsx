const Solutions = () => {
  const solutions = [
    {
      title: "Electronics Manufacturing",
      description: "Complete dispensing solutions for electronics assembly and manufacturing",
      features: [
        "PCB assembly automation",
        "Component protection coating",
        "Precision solder paste dispensing",
        "Quality control integration"
      ],
      icon: "🔌"
    },
    {
      title: "Automotive Industry",
      description: "Specialized solutions for automotive electronics and component manufacturing",
      features: [
        "Automotive grade materials",
        "High-volume production support",
        "Environmental compliance",
        "Durability testing"
      ],
      icon: "🚗"
    },
    {
      title: "Medical Device Manufacturing",
      description: "Precision solutions for medical device assembly and packaging",
      features: [
        "Clean room compatibility",
        "Biocompatible materials",
        "Regulatory compliance",
        "Traceability systems"
      ],
      icon: "🏥"
    },
    {
      title: "Aerospace & Defense",
      description: "High-reliability solutions for aerospace and defense applications",
      features: [
        "Military grade standards",
        "Extreme environment testing",
        "Documentation compliance",
        "Long-term support"
      ],
      icon: "✈️"
    }
  ]

  const caseStudies = [
    {
      title: "Electronics Manufacturer Success Story",
      description: "How we helped a leading electronics manufacturer increase production efficiency by 40%",
      results: [
        "40% increase in production efficiency",
        "60% reduction in material waste",
        "99.5% quality consistency achieved",
        "ROI achieved in 8 months"
      ],
      industry: "Electronics Manufacturing"
    },
    {
      title: "Automotive Supplier Optimization",
      description: "Complete system overhaul for automotive component supplier",
      results: [
        "50% faster cycle times",
        "Zero defect rate achieved",
        "30% cost reduction",
        "24/7 production capability"
      ],
      industry: "Automotive"
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Industry Solutions
            </h1>
            <p className="text-xl text-primary-100">
              Tailored dispensing solutions for various industries and applications
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
            {solutions.map((solution, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{solution.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{solution.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">{solution.description}</p>
                  <ul className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
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
            {caseStudies.map((study, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{study.title}</h3>
                      <p className="text-gray-600 mb-4">{study.description}</p>
                      <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {study.industry}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {study.results.map((result, resultIndex) => (
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
            {[
              {
                step: "01",
                title: "Consultation",
                description: "Understanding your requirements and challenges"
              },
              {
                step: "02", 
                title: "Design",
                description: "Creating customized solutions and system design"
              },
              {
                step: "03",
                title: "Implementation",
                description: "Installation, testing, and system integration"
              },
              {
                step: "04",
                title: "Support",
                description: "Ongoing maintenance and technical support"
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {process.step}
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
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Increased Efficiency</h3>
              <p className="text-gray-600">Optimize your production processes and reduce cycle times with our advanced automation solutions</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality Assurance</h3>
              <p className="text-gray-600">Ensure consistent quality and reduce defects with precision dispensing and automated quality control</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Cost Reduction</h3>
              <p className="text-gray-600">Reduce material waste, labor costs, and downtime with efficient automation and optimized processes</p>
            </div>
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
