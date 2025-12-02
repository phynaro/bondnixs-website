import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { contactFaqAPI } from '../../services/api'

const ContactFaqForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    display_order: 0,
    published: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      fetchFaq()
    }
  }, [id, isEdit])

  const fetchFaq = async () => {
    try {
      const response = await contactFaqAPI.getAllFaqsAdmin()
      const faq = response.data.data.find(f => f.id === id)
      
      if (faq) {
        setFormData({
          question: faq.question || '',
          answer: faq.answer || '',
          display_order: faq.display_order || 0,
          published: faq.published
        })
      }
    } catch (error) {
      console.error('Error fetching FAQ:', error)
      alert('Failed to load FAQ')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit) {
        await contactFaqAPI.updateFaq(id, formData)
        alert('FAQ updated successfully')
      } else {
        await contactFaqAPI.createFaq(formData)
        alert('FAQ created successfully')
      }
      navigate('/admin/faq')
    } catch (error) {
      console.error('Error saving FAQ:', error)
      alert(error.response?.data?.message || 'Failed to save FAQ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit FAQ' : 'Create FAQ'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Update frequently asked question' : 'Add new frequently asked question'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Question *
            </label>
            <input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter the question"
            />
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
              Answer *
            </label>
            <textarea
              id="answer"
              name="answer"
              value={formData.answer}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter the answer"
            />
          </div>

          <div>
            <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              id="display_order"
              name="display_order"
              value={formData.display_order}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Published</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/faq')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ContactFaqForm

