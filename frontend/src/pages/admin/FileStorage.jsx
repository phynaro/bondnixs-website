import { useState, useEffect } from 'react'
import { fileStorageAPI, getDocumentUrl, formatFileSize } from '../../services/api'
import { 
  FileText, Image, FileSpreadsheet, Presentation, 
  Video, Music, Archive, Code, FileQuestion,
  Link2, BarChart3, Download, Trash2, X, Check
} from 'lucide-react'

const FileStorage = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showActivities, setShowActivities] = useState(false)
  const [activities, setActivities] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadForm, setUploadForm] = useState({
    file: null,
    description: ''
  })
  const [copySuccess, setCopySuccess] = useState(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fileStorageAPI.getFiles()
      setFiles(response.data.data)
    } catch (error) {
      console.error('Error fetching files:', error)
      alert('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadForm({ ...uploadForm, file })
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadForm.file) {
      alert('Please select a file to upload')
      return
    }

    try {
      setUploading(true)
      await fileStorageAPI.uploadFile(uploadForm.file, uploadForm.description)
      alert('File uploaded successfully')
      setUploadForm({ file: null, description: '' })
      // Reset file input
      const fileInput = document.getElementById('file-input')
      if (fileInput) fileInput.value = ''
      fetchFiles()
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      try {
        await fileStorageAPI.deleteFile(id)
        alert('File deleted successfully')
        fetchFiles()
        if (selectedFile?.id === id) {
          setSelectedFile(null)
          setShowActivities(false)
        }
      } catch (error) {
        console.error('Error deleting file:', error)
        alert('Failed to delete file')
      }
    }
  }

  const handleCopyLink = async (id) => {
    try {
      const response = await fileStorageAPI.getFileLink(id)
      const link = response.data.data.link
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link)
      setCopySuccess(id)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      alert('Failed to copy link')
    }
  }

  const handleViewActivities = async (file) => {
    setSelectedFile(file)
    try {
      const response = await fileStorageAPI.getFileActivities(file.id)
      setActivities(response.data.data)
      setShowActivities(true)
    } catch (error) {
      console.error('Error fetching activities:', error)
      alert('Failed to fetch file activities')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileTypeIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const iconProps = { className: 'h-5 w-5 text-gray-500' }
    
    const iconMap = {
      'pdf': <FileText {...iconProps} />,
      'doc': <FileText {...iconProps} />,
      'docx': <FileText {...iconProps} />,
      'ppt': <Presentation {...iconProps} />,
      'pptx': <Presentation {...iconProps} />,
      'xls': <FileSpreadsheet {...iconProps} />,
      'xlsx': <FileSpreadsheet {...iconProps} />,
      'jpg': <Image {...iconProps} />,
      'jpeg': <Image {...iconProps} />,
      'png': <Image {...iconProps} />,
      'gif': <Image {...iconProps} />,
      'webp': <Image {...iconProps} />,
      'svg': <Image {...iconProps} />,
      'txt': <FileText {...iconProps} />,
      'csv': <FileSpreadsheet {...iconProps} />,
      'mp4': <Video {...iconProps} />,
      'avi': <Video {...iconProps} />,
      'mov': <Video {...iconProps} />,
      'mp3': <Music {...iconProps} />,
      'wav': <Music {...iconProps} />,
      'zip': <Archive {...iconProps} />,
      'rar': <Archive {...iconProps} />,
      '7z': <Archive {...iconProps} />,
      'tar': <Archive {...iconProps} />,
      'gz': <Archive {...iconProps} />,
      'js': <Code {...iconProps} />,
      'ts': <Code {...iconProps} />,
      'json': <Code {...iconProps} />,
      'xml': <Code {...iconProps} />,
      'html': <Code {...iconProps} />,
      'css': <Code {...iconProps} />
    }
    
    return iconMap[ext] || <FileQuestion {...iconProps} />
  }

  const filteredFiles = files.filter(file => {
    return file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
           file.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">File Storage</h1>
        <p className="mt-2 text-gray-600">Manage and store important files</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                cursor-pointer"
              required
            />
            {uploadForm.file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter file description..."
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !uploadForm.file}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search files by name, description, or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {/* Files List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Files ({filteredFiles.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No files found
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3 flex-shrink-0">
                          {getFileTypeIcon(file.original_name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {file.original_name}
                          </div>
                          {file.description && (
                            <div className="text-sm text-gray-500">{file.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.formatted_file_size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.uploaded_by_name || file.uploaded_by}</div>
                      <div className="text-sm text-gray-500">{file.uploaded_by}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.uploaded_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(file.id)}
                          className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
                          title="Copy link"
                        >
                          {copySuccess === file.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleViewActivities(file)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          title="View activities"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <a
                          href={getDocumentUrl(file.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                          title="Download/View"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(file.id, file.original_name)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Activities Modal */}
      {showActivities && selectedFile && (
        <div className="modal-container" onClick={() => setShowActivities(false)}>
          <div className="modal-overlay"></div>
          <div className="modal-wrapper flex min-h-full items-center justify-center p-4">
            <div className="modal-content w-11/12 md:w-3/4 lg:w-1/2" onClick={(e) => e.stopPropagation()}>
              <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity History: {selectedFile.original_name}
              </h3>
              <button
                onClick={() => setShowActivities(false)}
                className="modal-close-button p-1.5"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activities found</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-b border-gray-200 pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              by {activity.performed_by_name || activity.performed_by}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(activity.performed_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileStorage

