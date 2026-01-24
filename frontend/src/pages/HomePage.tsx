
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Truck, Award, ShieldCheck } from 'lucide-react';
import { useProductStore } from '../../../store';
import ProductCard from '../components/products/ProductCard';

const HomePage: React.FC = () => {
  const products = useProductStore((state) => state.products).slice(0, 4);

  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1594631252845-29fc458695d7?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover"
            alt="Tea plantation"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 bg-accent-600/90 text-black text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Spring 2024 Collection
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              A Symphony of <br /> <span className="italic text-tea-200">Nature & Heritage</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-10 leading-relaxed font-light">
              Experience the world's most exquisite, hand-plucked teas delivered directly from high-altitude estates to your sanctuary.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="px-8 py-4 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl text-center transition-all transform hover:scale-105 flex items-center justify-center group">
                Shop the Collection
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/quiz" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl text-center transition-all border border-white/30">
                Take the Tea Quiz
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Leaf, title: 'Single Estate', desc: 'Directly from heritage gardens' },
            { icon: Truck, title: 'Express Delivery', desc: 'Freshness locked in every pack' },
            { icon: Award, title: 'Sommelier Grade', desc: 'Expertly curated selections' },
            { icon: ShieldCheck, title: 'Ethically Sourced', desc: 'Fair trade and organic focused' },
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
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold text-tea-900 mb-4">Master's Selection</h2>
              <p className="text-gray-600 max-w-lg">Hand-picked by our sommeliers for their unique flavor profile and exceptional clarity.</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center text-tea-700 font-bold hover:underline">
              View All Teas <ArrowRight className="ml-1 w-4 h-4" />
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
      <section className="py-24 bg-tea-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1544787210-2213d2429f77?auto=format&fit=crop&q=80&w=800"
                alt="Brewing tea"
                className="w-full h-[500px] object-cover"
              />
            </motion.div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-5xl font-serif font-bold mb-8">The Art of <br /> Mindful Brewing</h2>
            <p className="text-tea-100/80 text-lg mb-8 leading-relaxed">
              At Tea Time, we believe every cup is a meditation. Our journey began in the mist-covered mountains of Kyoto, where we learned that the finest teas are not just grown, but cultivated with soul.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full" />
                <span>Small-batch artisanal drying processes</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full" />
                <span>Oxygen-free nitrogen sealed packaging</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full" />
                <span>Full traceability for every tea leaf</span>
              </li>
            </ul>
            <button className="px-10 py-4 bg-accent-600 hover:bg-accent-700 text-tea-900 font-bold rounded-2xl transition-all">
              Discover Our Roots
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
