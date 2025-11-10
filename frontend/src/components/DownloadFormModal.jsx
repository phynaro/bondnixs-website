import { useState } from 'react'
import { documentAPI } from '../services/api'

const DownloadFormModal = ({ isOpen, onClose, document, product, onDownloadSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await documentAPI.requestDocumentDownload(
        product.id,
        document.id,
        formData
      )
      
      if (response.data.success) {
        // Trigger download
        const link = window.document.createElement('a')
        link.href = response.data.data.documentUrl
        link.download = response.data.data.documentName || document.document_name
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)

        // Close modal and reset form
        onClose()
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: ''
        })
        
        // Call success callback if provided
        if (onDownloadSuccess) {
          onDownloadSuccess()
        }
      } else {
        setErrorMessage('Failed to process download request. Please try again.')
      }
    } catch (error) {
      console.error('Error requesting document download:', error)
      
      // Handle specific error types
      if (error.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
        setErrorMessage('You have reached the download limit. Please wait about 15 minutes and try again.')
      } else if (error.response?.data?.code === 'EMAIL_COOLDOWN_ACTIVE') {
        const minutes = error.response.data.retryAfter ?? 30
        setErrorMessage(`This email address has recently requested a download. Please retry in about ${minutes} minute${minutes === 1 ? '' : 's'}.`)
      } else if (error.response?.status === 429 && error.response?.data?.code === 'SUSPICIOUS_ACTIVITY') {
        setErrorMessage('We detected too many download requests in a short time. Please try again later.')
      } else if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message)
      } else {
        setErrorMessage('Sorry, there was an error processing your download request. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: ''
      })
      setErrorMessage('')
    }
  }

  return (
    <div className="modal-container" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div 
        className="modal-overlay"
        onClick={handleClose}
      ></div>

      {/* Modal panel */}
      <div className="modal-wrapper flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="modal-content sm:my-8 sm:w-full sm:max-w-lg">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="modal-close-button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal content */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4" id="modal-title">
                  Download Document
                </h3>
                
                {/* Document info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Product:</span> {product.name} ({product.model})
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Document:</span> {document.document_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {document.document_type}
                  </p>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Please provide your contact information to download this document.
                </p>

                {/* Error message */}
                {errorMessage && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="your.email@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="+66 XX XXX XXXX"
                    />
                  </div>

                  {/* Honeypot fields - hidden from users but visible to bots */}
                  <div style={{ display: 'none' }}>
                    <input
                      type="text"
                      name="website"
                      tabIndex="-1"
                      autoComplete="off"
                    />
                    <input
                      type="text"
                      name="url"
                      tabIndex="-1"
                      autoComplete="off"
                    />
                    <input
                      type="text"
                      name="honeypot"
                      tabIndex="-1"
                      autoComplete="off"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                        isSubmitting
                          ? 'bg-gray-400'
                          : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        'Download'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadFormModal

