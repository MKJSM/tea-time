import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Coffee, Star, ArrowLeft, Phone, Mail } from 'lucide-react';

const EventsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <section className="relative bg-gradient-to-br from-purple-900 to-purple-700 text-white py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>

                    <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
                        Event Catering Services
                    </h1>
                    <p className="text-xl text-purple-100 max-w-2xl">
                        Elevate your special occasions with our premium tea catering service.
                        Perfect for weddings, corporate events, and celebrations.
                    </p>
                </div>
            </section>

            {/* Services Overview */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-serif font-bold text-center mb-12">
                        Our Event Services
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Users,
                                title: 'Wedding Tea Service',
                                description: 'Create unforgettable moments with elegant tea service for your special day.',
                                features: ['Custom tea blends', 'Fine china service', 'Professional staff']
                            },
                            {
                                icon: Coffee,
                                title: 'Corporate Events',
                                description: 'Impress clients and colleagues with premium tea catering for business events.',
                                features: ['Bulk tea orders', 'Branded packaging', 'Flexible scheduling']
                            },
                            {
                                icon: Calendar,
                                title: 'Private Celebrations',
                                description: 'Make birthdays, anniversaries, and gatherings extra special with our tea service.',
                                features: ['Customizable menus', 'Themed setups', 'All group sizes']
                            }
                        ].map((service, idx) => (
                            <div
                                key={idx}
                                className="glass-card p-8 rounded-2xl hover:shadow-tea-glow transition-shadow"
                            >
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                    <service.icon className="text-purple-700" size={32} />
                                </div>
                                <h3 className="text-2xl font-serif font-bold mb-4">{service.title}</h3>
                                <p className="text-gray-600 mb-6">{service.description}</p>
                                <ul className="space-y-2">
                                    {service.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                            <Star size={16} className="text-amber-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-20 bg-cream">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="glass-card p-8 md:p-12 rounded-3xl">
                        <h2 className="text-3xl font-serif font-bold mb-6 text-center">
                            Get Your Custom Quote
                        </h2>
                        <p className="text-gray-600 text-center mb-8">
                            Fill out the form below and we'll get back to you within 24 hours with a personalized quote.
                        </p>

                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Event Type *
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                    >
                                        <option value="">Select event type</option>
                                        <option value="wedding">Wedding</option>
                                        <option value="corporate">Corporate Event</option>
                                        <option value="birthday">Birthday Party</option>
                                        <option value="anniversary">Anniversary</option>
                                        <option value="other">Other Celebration</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Expected Guests *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Event Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Additional Details
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors resize-none"
                                    placeholder="Tell us more about your event, preferred tea selections, special requirements, etc."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                Request Custom Quote
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-center text-gray-600 mb-4">
                                Prefer to talk directly? Reach out to us:
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <a
                                    href="tel:+1234567890"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 transition-colors"
                                >
                                    <Phone size={18} className="text-purple-700" />
                                    <span className="font-semibold text-gray-700">(123) 456-7890</span>
                                </a>
                                <a
                                    href="mailto:events@teatime.com"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 transition-colors"
                                >
                                    <Mail size={18} className="text-purple-700" />
                                    <span className="font-semibold text-gray-700">events@teatime.com</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '500+', label: 'Events Served' },
                            { number: '4.9/5', label: 'Average Rating' },
                            { number: '10K+', label: 'Happy Guests' },
                            { number: '24hr', label: 'Quote Response' }
                        ].map((stat, idx) => (
                            <div key={idx}>
                                <div className="text-4xl font-serif font-bold text-purple-700 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default EventsPage;
