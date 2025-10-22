import { useState, useEffect } from 'react'
import { contactAPI } from '../../services/api'

const MessageList = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await contactAPI.getMessages()
      setMessages(response.data.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      await contactAPI.updateMessageStatus(messageId, newStatus)
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, status: newStatus } : msg
      ))
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      await contactAPI.deleteMessage(messageId)
      setMessages(messages.filter(msg => msg.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setShowModal(false)
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const openMessageModal = async (messageId) => {
    try {
      const response = await contactAPI.getMessage(messageId)
      setSelectedMessage(response.data.data)
      setShowModal(true)
      
      // Mark as read if it's new
      if (response.data.data.status === 'new') {
        handleStatusChange(messageId, 'read')
      }
    } catch (error) {
      console.error('Error fetching message details:', error)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedMessage(null)
  }

  const filteredMessages = messages.filter(message => {
    if (statusFilter === 'all') return true
    return message.status === statusFilter
  })

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'New' },
      read: { bg: 'bg-green-100', text: 'text-green-800', label: 'Read' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' }
    }
    
    const config = statusConfig[status] || statusConfig.new
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchMessages}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="mt-2 text-gray-600">Manage incoming contact form submissions</p>
      </div>

      {/* Filter and Stats */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Filter by status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Messages</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Total: {messages.length}</span>
              <span>New: {messages.filter(m => m.status === 'new').length}</span>
              <span>Read: {messages.filter(m => m.status === 'read').length}</span>
              <span>Archived: {messages.filter(m => m.status === 'archived').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No messages found
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {message.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {message.email}
                        </div>
                        {message.company && (
                          <div className="text-sm text-gray-500">
                            {message.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {message.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(message.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(message.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openMessageModal(message.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        <select
                          value={message.status}
                          onChange={(e) => handleStatusChange(message.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Message Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.company && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.company}</p>
                    </div>
                  )}
                  {selectedMessage.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.phone}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMessage.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Received: {formatDate(selectedMessage.created_at)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedMessage.status}
                      onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList
