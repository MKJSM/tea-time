
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Truck, Award, ShieldCheck } from 'lucide-react';
import { useGetFeaturedProductsQuery } from '../features/products/productsApi';
import { useAppSelector } from '../store/hooks';
import ProductCard from '../components/products/ProductCard';

import { getOptimizedImageUrl, PLACEHOLDER_TEA_IMAGE } from '../utils/images';

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomePage: React.FC = () => {
  const { data: products = [] } = useGetFeaturedProductsQuery(undefined);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const greeting = getTimeBasedGreeting();

  return (
    <div className="bg-cream">
      {/* Hero Section - Optimized with CSS animations */}
      <section className="relative h-[90vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={getOptimizedImageUrl(PLACEHOLDER_TEA_IMAGE, 2000)}
            srcSet={`
              ${getOptimizedImageUrl(PLACEHOLDER_TEA_IMAGE, 800)} 800w,
              ${getOptimizedImageUrl(PLACEHOLDER_TEA_IMAGE, 1200)} 1200w,
              ${getOptimizedImageUrl(PLACEHOLDER_TEA_IMAGE, 2000)} 2000w
            `}
            sizes="100vw"
            className="w-full h-full object-cover"
            alt="Tea plantation with fresh green leaves"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-2xl animate-fadeIn">
            <div className="mb-4">
              <span className="text-xl md:text-2xl font-serif text-tea-200">
                {greeting}{isAuthenticated && user ? `, ${user.name}` : '!'}
              </span>
              <p className="text-sm text-gray-300 mt-1">
                {isAuthenticated && user
                  ? (user.last_login_at ? 'Welcome back to your tea time!' : 'Welcome to Tea Time! We\'re glad you\'re here.')
                  : 'Welcome to Tea Time! Start your day with the perfect brew.'}
              </p>
            </div>
            <span className="inline-block px-4 py-1 bg-accent-600/90 text-black text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              New Arrivals
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              Fresh Tea & <br /> <span className="italic text-tea-200">Tasty Snacks</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-10 leading-relaxed font-light">
              Get premium quality teas and delicious snacks delivered fresh to your doorstep. Perfect for your chai time!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="px-8 py-4 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl text-center transition-colors flex items-center justify-center group">
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
              <Link to="/about" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl text-center transition-colors border border-white/30">
                Learn More About Tea Time
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <h2 className="sr-only">Our Values</h2>
          {[
            { icon: Leaf, title: 'Premium Quality', desc: 'Handpicked from the best farms' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Fresh products at your door' },
            { icon: Award, title: 'Top Rated', desc: 'Loved by thousands of customers' },
            { icon: ShieldCheck, title: 'Safe & Hygienic', desc: '100% quality checked' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-tea-50 text-tea-700 rounded-2xl flex items-center justify-center mb-4">
                <item.icon size={28} />
              </div>
              <h3 className="font-serif font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-cream content-visibility-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold text-tea-900 mb-4">Popular Products</h2>
              <p className="text-gray-600 max-w-lg">Our best selling teas and snacks that customers love the most.</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center text-tea-700 font-bold hover:underline">
              View All Products <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((tea) => (
              <ProductCard key={tea.id} product={tea} />
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-tea-900 text-white overflow-hidden relative content-visibility-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <div className="relative rounded-3xl overflow-hidden">
              <img
                src={getOptimizedImageUrl(PLACEHOLDER_TEA_IMAGE, 800)}
                alt="Brewing tea process"
                className="w-full h-[500px] object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-5xl font-serif font-bold mb-8">Why Choose <br /> Tea Time?</h2>
            <p className="text-tea-100/80 text-lg mb-8 leading-relaxed">
              We believe in bringing you the best quality tea and snacks at great prices. Every product is carefully selected to make sure you get only the freshest items.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full" aria-hidden="true" />
                <span>Fresh products sourced directly from farms</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full" aria-hidden="true" />
                <span>Packed fresh to keep the taste intact</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full" aria-hidden="true" />
                <span>Quality checked before delivery</span>
              </li>
            </ul>
            <Link to="/about" className="inline-block px-10 py-4 bg-accent-600 hover:bg-accent-700 text-tea-900 font-bold rounded-2xl transition-colors">
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
