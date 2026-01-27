
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGetProductsPaginatedQuery, useGetCategoriesQuery } from '../features/products/productsApi';
import ProductCard from '../components/products/ProductCard';
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCardSkeleton } from '../components/common/Skeleton';

const DEFAULT_LIMIT = 12;

const ProductsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get('q') || '';
  const pageParam = parseInt(queryParams.get('page') || '1', 10);

  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(pageParam);

  // Sync state with URL changes
  useEffect(() => {
    setSearchTerm(q);
    setCurrentPage(pageParam);
  }, [q, pageParam]);

  // Fetch categories
  const { data: fetchedCategories = [] } = useGetCategoriesQuery();
  const categories = useMemo(() => ['All', ...fetchedCategories], [fetchedCategories]);

  // Fetch products with pagination
  const { data: paginatedData, isLoading, isFetching, error } = useGetProductsPaginatedQuery({
    page: currentPage,
    limit: DEFAULT_LIMIT,
    q: searchTerm,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
  });

  const products = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const total = paginatedData?.total || 0;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  // Update URL when page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (newPage > 1) params.set('page', newPage.toString());
    navigate(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-tea-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-500 mb-6">We couldn't load the products. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl"
          >
            Try Again
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
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-tea-900">All Products</h1>
            {isFetching && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-tea-700 border-t-transparent rounded-full" />}
          </div>
          <p className="text-gray-600 max-w-2xl">Browse our range of premium teas and tasty snacks. Something for everyone!</p>
        </header>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 sm:mb-10">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for tea, snacks..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm focus:ring-2 focus:ring-tea-500 outline-none transition-all text-sm sm:text-base"
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
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl shadow-sm font-bold transition-all text-sm sm:text-base ${isFilterOpen ? 'bg-tea-700 text-white' : 'bg-white text-tea-800 hover:bg-tea-50'
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
              className="overflow-hidden mb-8 sm:mb-10"
            >
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-inner border border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">By Category</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all uppercase tracking-widest ${selectedCategory === cat
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Showing <span className="text-tea-900 font-bold">{products.length}</span> of <span className="text-tea-900 font-bold">{total}</span> products
              {searchTerm && <span className="hidden xs:inline"> for "<span className="text-tea-800">{searchTerm}</span>"</span>}
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="text-xs sm:text-sm text-tea-700 font-bold flex items-center gap-1 hover:underline uppercase tracking-widest"
              >
                <X size={14} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: DEFAULT_LIMIT }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="py-20 text-center bg-white/50 rounded-[3rem] border border-dashed border-gray-200">
            <h3 className="text-2xl font-serif text-tea-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Try changing your filters or search to find what you're looking for.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="mt-6 px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl"
            >
              Reset Search
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && products.length > 0 && totalPages > 1 && (
          <div className="mt-16 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-tea-800 hover:bg-tea-50 active:scale-95'
                  }`}
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {getPageNumbers().map((page, idx) => (
                  <React.Fragment key={idx}>
                    {page === '...' ? (
                      <span className="w-8 h-8 flex items-center justify-center text-gray-300 font-bold tracking-widest text-xs select-none">...</span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page as number)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${currentPage === page
                            ? 'bg-tea-800 text-white shadow-md shadow-tea-900/10 scale-105'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-tea-900'
                          }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-tea-800 hover:bg-tea-50 active:scale-95'
                  }`}
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Page Info */}
        {!isLoading && products.length > 0 && totalPages > 1 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
