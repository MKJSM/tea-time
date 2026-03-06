import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Truck, Award, ShieldCheck, Sparkles, Coffee, Clock, Star } from 'lucide-react';
import { useGetFeaturedProductsQuery } from '../features/products/productsApi';
import { useAppSelector } from '../store/hooks';
import ProductCard from '../components/products/ProductCard';
import EventBanner from '../components/common/EventBanner';

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
      {/* Hero Section */}
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
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-2xl animate-fadeIn">
            <div className="mb-4">
              <span className="text-xl md:text-2xl font-serif text-tea-200">
                {greeting}{isAuthenticated && user ? `, ${user.name}` : '!'}
              </span>
            </div>
            <span className="inline-block px-4 py-1 bg-accent-600/90 text-black text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Premium Selection
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              Fresh Tea & <br /> <span className="italic text-tea-200">Tasty Snacks</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-10 leading-relaxed font-light">
              Experience the finest blends delivered fresh to your doorstep. Perfect for your daily ritual.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="px-8 py-4 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl text-center transition-all flex items-center justify-center group shadow-xl shadow-tea-900/40">
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/events" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl text-center transition-all border border-white/30">
                Plan an Event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Leaf, title: 'Pure Quality', desc: 'Direct from estates' },
            { icon: Truck, title: 'Aroma Intact', desc: 'Fast local delivery' },
            { icon: Award, title: 'Handcrafted', desc: 'Small batch blends' },
            { icon: ShieldCheck, title: 'Safe & Ritual', desc: 'Hygienic brewing' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 bg-tea-50 text-tea-700 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <item.icon size={28} />
              </div>
              <h3 className="font-serif font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catering Highlights New Section */}
      <section className="py-24 bg-cream border-y border-tea-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2 relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-tea-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-700"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200"
                  alt="Event Catering"
                  className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                  <p className="text-white font-serif text-lg italic italic">"The tea was the talk of the wedding!"</p>
                  <p className="text-tea-200 text-sm font-bold mt-2 uppercase tracking-widest">— Meera K.</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="inline-flex items-center gap-2 bg-tea-100 text-tea-800 px-4 py-1.5 rounded-full mb-6">
                <Sparkles size={14} className="text-tea-700" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Special Moments</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-tea-900 mb-6 leading-tight">Elevate Your Events with <span className="text-accent-600">Premium Catering</span></h2>
              <p className="text-tea-600 text-lg mb-8 leading-relaxed">
                Make your weddings, corporate meetings, and celebrations unforgettable with our handcrafted tea bar. We bring the full experience—live brewing, premium service, and our secret blends.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                {[
                  { icon: Coffee, title: 'Live Tea Bar', desc: 'Hot & cold options' },
                  { icon: Clock, title: 'Timely Setup', desc: 'Seamless service' },
                  { icon: Star, title: 'Custom Menus', desc: 'Tailored to you' },
                  { icon: Sparkles, title: 'Ritual Experience', desc: 'Memorable moments' }
                ].map((feat, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm border border-tea-100 flex items-center justify-center text-tea-700">
                      <feat.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-tea-900 text-sm">{feat.title}</p>
                      <p className="text-tea-500 text-xs">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/events" className="inline-flex items-center gap-2 px-10 py-4 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-tea-900/20 group">
                Plan Your Catering <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold text-tea-900 mb-4">Our Favorites</h2>
              <p className="text-gray-600 max-w-lg">Handpicked blends that our community loves.</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center text-tea-700 font-bold hover:underline">
              Shop All Products <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((tea) => (
              <ProductCard key={tea.id} product={tea} />
            ))}
          </div>
        </div>
      </section>

      <EventBanner />
    </div>
  );
};

export default HomePage;
