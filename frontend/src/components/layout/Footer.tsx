
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import logo from '../../assets/logo.webp';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-6 group">
              <img src={logo} alt="Tea Time" className="h-10 w-auto object-contain scale-110" />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Premium quality tea and snacks delivered fresh to your doorstep. Shop with us for the best prices!
            </p>
            <div className="flex space-x-4">
              {[
                { Icon: Instagram, label: 'Follow us on Instagram' },
                { Icon: Twitter, label: 'Follow us on Twitter' },
                { Icon: Facebook, label: 'Follow us on Facebook' },
                { Icon: Mail, label: 'Contact us via email' }
              ].map(({ Icon, label }, idx) => (
                <a key={idx} href="#" aria-label={label} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-tea-50 hover:text-tea-700 transition-all focus:outline-none focus:ring-2 focus:ring-tea-500">
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-tea-900 mb-6 uppercase text-xs tracking-widest">Shop</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">All Products</Link></li>
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Tea Collection</Link></li>
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Snacks</Link></li>
              <li><Link to="/shop" className="hover:text-tea-700 transition-colors">Gift Packs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-tea-900 mb-6 uppercase text-xs tracking-widest">Help</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/support" className="hover:text-tea-700 transition-colors">Contact Us</Link></li>
              <li><Link to="/support" className="hover:text-tea-700 transition-colors">Shipping Info</Link></li>
              <li><Link to="/support" className="hover:text-tea-700 transition-colors">Returns</Link></li>
              <li><Link to="/support" className="hover:text-tea-700 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-tea-900 mb-6 uppercase text-xs tracking-widest">Newsletter</h4>
            <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-tighter" id="newsletter-description">Get offers and updates</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()} aria-describedby="newsletter-description">
              <label htmlFor="newsletter-email" className="sr-only">Email address for newsletter</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-tea-500"
              />
              <button type="submit" className="bg-tea-700 text-white px-4 rounded-xl hover:bg-tea-800 transition-colors focus:outline-none focus:ring-2 focus:ring-tea-500 focus:ring-offset-2">Join</button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-gray-50 gap-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            © 2024 TEA TIME. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-tea-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-tea-700 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
