
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, Leaf } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-6 group">
              <div className="bg-tea-700 p-1.5 rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-serif font-bold text-tea-900">Tea Haven</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Curating the world's most exceptional tea experiences, connecting heritage estates with modern tea lovers.
            </p>
            <div className="flex space-x-4">
              {[Instagram, Twitter, Facebook, Mail].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-tea-50 hover:text-tea-700 transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-tea-900 mb-6 uppercase text-xs tracking-widest">Library</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Spring Harvest 2024</Link></li>
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Gift Collections</Link></li>
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Sommelier Selects</Link></li>
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Tea Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-tea-900 mb-6 uppercase text-xs tracking-widest">Rituals</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/quiz" className="hover:text-tea-700 transition-colors">Discovery Quiz</Link></li>
              <li><Link to="/profile" className="hover:text-tea-700 transition-colors">Tasting Journal</Link></li>
              <li><a href="#" className="hover:text-tea-700 transition-colors">Brewing Guides</a></li>
              <li><a href="#" className="hover:text-tea-700 transition-colors">The Tea Story</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-tea-900 mb-6 uppercase text-xs tracking-widest">Newsletter</h4>
            <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-tighter">Join the circle for rare drops</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm w-full outline-none focus:ring-1 focus:ring-tea-500" />
              <button className="bg-tea-700 text-white px-4 rounded-xl hover:bg-tea-800 transition-colors">Join</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-gray-50 gap-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            © 2024 TEA HAVEN ARTISAN IMPORTS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-tea-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-tea-700 transition-colors">Terms</a>
            <a href="#" className="hover:text-tea-700 transition-colors">Sustainability</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
