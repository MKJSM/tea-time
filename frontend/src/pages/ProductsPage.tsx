
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetProductsQuery } from '../features/products/productsApi';
import ProductCard from '../components/products/ProductCard';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCardSkeleton } from '../components/common/Skeleton';

const ProductsPage: React.FC = () => {
  const { data: products = [], isLoading, isFetching, error } = useGetProductsQuery();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync state with URL changes (e.g., from Navbar search)
  useEffect(() => {
    setSearchTerm(q);
  }, [q]);

  const categories = ['All', 'Green Tea', 'Black Tea', 'Oolong Tea', 'White Tea', 'Herbal Tea', 'Matcha'];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchStr || 
                            p.name.toLowerCase().includes(searchStr) || 
                            p.origin.toLowerCase().includes(searchStr) ||
                            p.category.toLowerCase().includes(searchStr);
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-tea-900 mb-2">Molecular Connection Interrupted</h2>
          <p className="text-gray-500 mb-6">We couldn't reach the tea vault. Please try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-tea-900">The Collection</h1>
            {isFetching && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-tea-700 border-t-transparent rounded-full" />}
          </div>
          <p className="text-gray-600 max-w-2xl">Browse our library of premium teas. From rare spring flushes to meditative herbal blends.</p>
        </header>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by name, origin or flavor..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm focus:ring-2 focus:ring-tea-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-tea-900"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl shadow-sm font-bold transition-all ${
              isFilterOpen ? 'bg-tea-700 text-white' : 'bg-white text-tea-800 hover:bg-tea-50'
            }`}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="bg-white p-8 rounded-[2rem] shadow-inner border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By Category</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                        selectedCategory === cat 
                        ? 'bg-tea-700 text-white shadow-lg' 
                        : 'bg-gray-50 text-tea-900/60 hover:text-tea-800 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Info */}
        {!isLoading && (
          <div className="flex justify-between items-center mb-8">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="text-tea-900 font-bold">{filteredProducts.length}</span> exceptional teas
              {searchTerm && <span> for "<span className="text-tea-800">{searchTerm}</span>"</span>}
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="text-sm text-tea-700 font-bold flex items-center gap-1 hover:underline"
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((tea) => (
                <motion.div
                  key={tea.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={tea} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="py-20 text-center bg-white/50 rounded-[3rem] border border-dashed border-gray-200">
            <h3 className="text-2xl font-serif text-tea-900 mb-2">No teas found in the sanctuary</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search term to discover other exquisite varieties.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="mt-6 px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
