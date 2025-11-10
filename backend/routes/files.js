const express = require('express')
const router = express.Router()
const path = require('path')
const { fileStorageQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { handleFileStorageUpload, deleteFile, getFileStorageUrl, formatFileSize, getFileTypeIcon } = require('../middleware/upload')

// Get all files - Admin only
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await fileStorageQueries.getAllFiles()
    
    // Add file type icons and formatted file sizes
    const files = result.rows.map(file => ({
      ...file,
      file_type_icon: getFileTypeIcon(file.file_url),
      formatted_file_size: formatFileSize(file.file_size)
    }))

    res.json({
      success: true,
      data: files
    })
  } catch (error) {
    console.error('Error fetching files:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files'
    })
  }
})

// Get file by ID - Admin only
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await fileStorageQueries.getFileById(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const file = result.rows[0]
    
    // Log view activity
    await fileStorageQueries.createFileActivity({
      file_id: id,
      activity_type: 'viewed',
      performed_by: req.user.email,
      performed_by_name: req.user.name,
      details: {
        ip: req.ip,
        user_agent: req.get('user-agent')
      }
    })

    res.json({
      success: true,
      data: {
        ...file,
        file_type_icon: getFileTypeIcon(file.file_url),
        formatted_file_size: formatFileSize(file.file_size)
      }
    })
  } catch (error) {
    console.error('Error fetching file:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file'
    })
  }
})

// Upload file - Admin only
router.post('/', authenticateToken, requireAdmin, handleFileStorageUpload, async (req, res) => {
  try {
    const { description } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    // Construct relative path from storage directory
    // req.file.path contains full path, we need relative path from storage dir
    const storageDir = path.join(__dirname, '../uploads/storage')
    const relativePath = path.relative(storageDir, req.file.path).replace(/\\/g, '/')
    
    const fileData = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_url: getFileStorageUrl(relativePath),
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      description: description || null,
      uploaded_by: req.user.email,
      uploaded_by_name: req.user.name
    }

    const result = await fileStorageQueries.createFile(fileData)
    
    // Log upload activity
    await fileStorageQueries.createFileActivity({
      file_id: result.rows[0].id,
      activity_type: 'uploaded',
      performed_by: req.user.email,
      performed_by_name: req.user.name,
      details: {
        ip: req.ip,
        user_agent: req.get('user-agent'),
        file_size: req.file.size,
        mime_type: req.file.mimetype
      }
    })

    res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        file_type_icon: getFileTypeIcon(result.rows[0].file_url),
        formatted_file_size: formatFileSize(result.rows[0].file_size)
      },
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    })
  }
})

// Update file metadata - Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { description } = req.body

    // Check if file exists
    const existingResult = await fileStorageQueries.getFileById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const fileData = {
      description: description || null
    }

    const result = await fileStorageQueries.updateFile(id, fileData)
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        file_type_icon: getFileTypeIcon(result.rows[0].file_url),
        formatted_file_size: formatFileSize(result.rows[0].file_size)
      },
      message: 'File updated successfully'
    })
  } catch (error) {
    console.error('Error updating file:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update file'
    })
  }
})

// Delete file - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if file exists
    const existingResult = await fileStorageQueries.getFileById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const file = existingResult.rows[0]

    // Log delete activity before deleting
    await fileStorageQueries.createFileActivity({
      file_id: id,
      activity_type: 'deleted',
      performed_by: req.user.email,
      performed_by_name: req.user.name,
      details: {
        ip: req.ip,
        user_agent: req.get('user-agent'),
        filename: file.filename,
        original_name: file.original_name
      }
    })

    // Delete file from database (this will cascade delete activities)
    await fileStorageQueries.deleteFile(id)

    // Delete physical file
    // file_url format: /uploads/storage/2024/11/filename.pdf
    const filePath = file.file_url.replace('/uploads/storage/', '')
    const fullPath = path.join(__dirname, '../uploads/storage', filePath)
    deleteFile(fullPath)

    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    })
  }
})

// Get file link - Admin only
router.get('/:id/link', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await fileStorageQueries.getFileById(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const file = result.rows[0]
    const baseUrl = req.protocol + '://' + req.get('host')
    const fileLink = baseUrl + file.file_url

    // Log link copy activity
    await fileStorageQueries.createFileActivity({
      file_id: id,
      activity_type: 'link_copied',
      performed_by: req.user.email,
      performed_by_name: req.user.name,
      details: {
        ip: req.ip,
        user_agent: req.get('user-agent')
      }
    })

    res.json({
      success: true,
      data: {
        link: fileLink,
        filename: file.original_name
      }
    })
  } catch (error) {
    console.error('Error getting file link:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get file link'
    })
  }
})

// Get file activities - Admin only
router.get('/:id/activities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if file exists
    const fileResult = await fileStorageQueries.getFileById(id)
    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const result = await fileStorageQueries.getFileActivities(id)
    
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching file activities:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file activities'
    })
  }
})

module.exports = router

