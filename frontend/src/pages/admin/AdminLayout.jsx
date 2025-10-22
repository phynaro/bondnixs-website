import { useAuth } from '../../hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: null },
    { name: 'Products', href: '/admin/products', icon: null },
    { name: 'Categories', href: '/admin/categories', icon: null },
    { name: 'Messages', href: '/admin/messages', icon: null },
    { name: 'Recipients', href: '/admin/recipients', icon: null }
  ]

  const isCurrentPath = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src="/bondnixs.png" 
              alt="Bondnixs Logo" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-primary-800">BONDNIXS</h1>
              <p className="text-xs text-primary-600">Admin</p>
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="bg-white border-t border-gray-200 shadow-lg">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isCurrentPath(item.href)
                      ? 'bg-primary-100 text-primary-800 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {/* Mobile User Section */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  {user?.picture ? (
                    <img
                      className="h-8 w-8 rounded-full border-2 border-gray-200"
                      src={user.picture}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-xs font-medium text-primary-700">
                        {user?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  closeMobileMenu()
                  logout()
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-gray-200 bg-primary-50">
            <div className="flex items-center space-x-3">
              <img 
                src="/bondnixs.png" 
                alt="Bondnixs Logo" 
                className="h-10 w-auto"
              />
              <div className="text-center">
                <h1 className="text-xl font-bold text-primary-800">BONDNIXS</h1>
                <p className="text-sm text-primary-600">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isCurrentPath(item.href)
                    ? 'bg-primary-100 text-primary-800 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                {user?.picture ? (
                  <img
                    className="h-10 w-10 rounded-full border-2 border-gray-200"
                    src={user.picture}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-sm font-medium text-primary-700">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-8 pt-20 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
