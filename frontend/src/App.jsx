import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './pages/admin/AdminLayout'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import CookieConsent from './components/CookieConsent'
import Home from './pages/Home'
import About from './pages/About'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Solutions from './pages/Solutions'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Login from './pages/admin/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProductList from './pages/admin/ProductList'
import ProductForm from './pages/admin/ProductForm'
import CategoryList from './pages/admin/CategoryList'

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Admin routes with separate layout */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductList />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute>
              <AdminLayout>
                <CategoryList />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/new" element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/edit/:id" element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Main website routes with Header/Footer layout */}
          <Route path="/*" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:model" element={<ProductDetail />} />
                  <Route path="/solutions" element={<Solutions />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                </Routes>
              </main>
              <Footer />
              <CookieConsent />
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
