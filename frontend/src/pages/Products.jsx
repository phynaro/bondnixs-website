const Products = () => {
  const productCategories = [
    {
      title: "Desktop Robots",
      description: "Precision dispensing robots for automated manufacturing",
      products: [
        "DT-FN series Desktop Dispensing Robot",
        "DT-200T 3-Axis Dispensing Robot", 
        "DT-ST series DESKTOP DISPENSING ROBOT",
        "DT-500GS Gantry Dispensing Robot",
        "DT-Q series Costdown Robot",
        "DT-500Q2Y Dual Tables Dispensing Robot",
        "DT-LV series Lan Smart Vision Robot",
        "DT-GS series Gantry Dispensing Robot",
        "DT-DIY series 3-Axis Dispensing Robot",
        "DT-HR series NEW! 4-axis Dispensing Robot",
        "DT-ST-LV series AUTO ALIGNMENT SYSTEM ROBOT",
        "DT-GLV series H Shape Auto Alignment System Robot"
      ]
    },
    {
      title: "Dispensing Controllers",
      description: "Advanced control systems for precise dispensing operations",
      products: [
        "6000E-Standard Dispenser",
        "9000F Micro-pressing Processor Digital Dispenser",
        "8000D-Micro Processor Dispenser",
        "RT-100 Peristaltic Glue Dispenser",
        "9000E-Micro Processor Digital Dispenser",
        "SP-1000 Syringe Pump Dispenser",
        "VC-1000 Valve Controller",
        "AVC-2100 Auger Valve Controller"
      ]
    },
    {
      title: "Dispensing Valves",
      description: "High-precision valves for various dispensing applications",
      products: [
        "DV-300T-Diaphragm Valve",
        "DV-500-Needle Off Spray Valve",
        "DV-303-Suck-Back Valve",
        "DV-500T- Conformal Coating Valve",
        "DV-386-Needle Off Valve",
        "PDV-7100 Precision auger valve"
      ]
    },
    {
      title: "Dispensing Accessories",
      description: "Essential accessories and consumables for dispensing systems",
      products: [
        "Needles and Tips",
        "Syringes and Pistons"
      ]
    },
    {
      title: "Customized Services",
      description: "Tailored solutions for specific customer requirements",
      products: [
        "DT-SF Automatic Screw Fastening Robot",
        "Large Stroke Table",
        "DT-SR Soldering Robot",
        "All Kinds of slides"
      ]
    },
    {
      title: "Other Products",
      description: "Additional tools and software solutions",
      products: [
        "Tip Finder",
        "SRE software - SMART ROBOT EDIT",
        "Hand tools - SATA"
      ]
    }
  ]

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

      {/* Product Categories */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Range
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              BONDNIXS provides a one-stop services – offering dispensing solutions, expert engineering consultation, and a dedicated service team to support customers throughout the entire process.
            </p>
          </div>

          <div className="space-y-12">
            {productCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white p-6">
                  <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                  <p className="text-primary-100">{category.description}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.products.map((product, productIndex) => (
                      <div key={productIndex} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 font-medium">{product}</span>
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
