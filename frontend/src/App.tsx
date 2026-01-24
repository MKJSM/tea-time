import { useState, useEffect } from 'react'
import { Product } from './types'
import CustomizationModal from './components/CustomizationModal'

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err)
        setLoading(false)
      })
  }, [])

  const handleCustomizeClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleAddToCart = (product: Product, selectedOptions: any, quantity: number, totalPrice: number) => {
    console.log("Added to cart:", { product, selectedOptions, quantity, totalPrice })
    alert(`Added ${quantity} x ${product.name} to cart! Total: ₹${totalPrice}`)
    handleCloseModal()
  }

  const categories = ['All', 'Tea', 'Coffee', 'Milk', 'Shake', 'Beverages'];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">ST</div>
            <h1>Sip Time</h1>
          </div>

          <div className="location-selector">
            <span className="location-icon">📍</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Deliver to</div>
              <div style={{ fontWeight: 600 }}>Aarapalayam-Aruldeepuram Bridge</div>
            </div>
          </div>

          <div className="search-bar">
            <input type="text" placeholder="Search for tea, coffee, shakes..." />
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              👤
            </button>
            <button className="icon-btn">
              🛒
              <span className="badge">3</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        <div className="greeting">
          <h2>Good Evening, Jayasuriya!</h2>
          <p>What would you like to sip today?</p>
        </div>

        {/* Categories */}
        <div className="categories">
          {categories.map(cat => (
            <div 
              key={cat} 
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {loading ? (
            <p>Loading products...</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card" onClick={() => handleCustomizeClick(product)}>
                <div className={`product-image-container ${product.category}`}>
                  <div className="customizable-badge">
                    ⚙️ CUSTOMIZABLE
                  </div>
                  {product.image_url ? (
                     <img 
                       src={product.image_url} 
                       alt={product.name} 
                       className="product-image" 
                     />
                  ) : (
                    <div className="product-image">No Image</div>
                  )}
                </div>
                <div className="product-info">
                  <div className="product-category">{product.category}</div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-footer">
                    <div className="product-price">₹{product.base_price}</div>
                    <button 
                      className="add-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomizeClick(product);
                      }}
                    >
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CustomizationModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        product={selectedProduct} 
        onAddToCart={handleAddToCart} 
      />
    </>
  )
}

export default App