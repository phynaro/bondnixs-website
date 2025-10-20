// Simple API configuration test
console.log('Environment check:')
console.log('import.meta.env.DEV:', import.meta.env.DEV)
console.log('import.meta.env.MODE:', import.meta.env.MODE)
console.log('import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)

// Test the API configuration
import api from './src/services/api.js'

console.log('API Base URL from service:', api.defaults.baseURL)

// Test a simple request
api.get('/').then(response => {
  console.log('API test successful:', response.data)
}).catch(error => {
  console.error('API test failed:', error.message)
})
