const Privacy = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-primary-100">
              How we collect, use, and protect your personal information
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookie Policy</h2>
                
                <div className="space-y-6 text-gray-700">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">What are Cookies?</h3>
                    <p>
                      Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                      They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">How We Use Cookies</h3>
                    <p>We use cookies for the following purposes:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly and cannot be disabled.</li>
                      <li><strong>Analytics Cookies:</strong> These help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
                      <li><strong>Functional Cookies:</strong> These enable enhanced functionality and personalization, such as remembering your preferences.</li>
                      <li><strong>Marketing Cookies:</strong> These are used to track visitors across websites to display relevant and engaging advertisements.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Managing Your Cookie Preferences</h3>
                    <p>
                      You can control and manage cookies in various ways. Please note that removing or blocking cookies can impact your user experience 
                      and parts of our website may no longer be fully accessible.
                    </p>
                    <p className="mt-2">
                      Most browsers allow you to refuse cookies or delete them. You can usually find these settings in the options or preferences menu of your browser.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h3>
                    <p>
                      If you have any questions about our use of cookies or this privacy policy, please contact us at:
                    </p>
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                      <p><strong>Email:</strong> <a href="mailto:Hathaipat.w@bondnixs.co.th" className="text-primary-600 hover:text-primary-700">Hathaipat.w@bondnixs.co.th</a></p>
                      <p><strong>Phone:</strong> <a href="tel:+66925495845" className="text-primary-600 hover:text-primary-700">+66 92 549 5845</a></p>
                      <p><strong>Address:</strong> 88/55 Centro Village, Moo 11, Soi Kingkaew 37, Kingkaew Road, Racha Thewa, Bang Phli, Samut Prakan 10540, Thailand</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Updates to This Policy</h3>
                    <p>
                      We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page 
                      and updating the "Last Updated" date below.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Last Updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Privacy
