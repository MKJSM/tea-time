import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Mail, HelpCircle, ChevronDown, Package, CreditCard, Truck } from 'lucide-react';

const SupportPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-cream-paper pb-20 pt-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-tea-900 mb-4">How can we help?</h1>
                    <p className="text-gray-500 text-lg">Find answers to common questions or reach out to our team.</p>
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {[
                        { icon: MessageCircle, title: "Chat with Us", desc: "Available 9am - 6pm EST", action: "Start Chat" },
                        { icon: Mail, title: "Email Us", desc: "Response within 24 hours", action: "hello@teatime.com" },
                        { icon: Phone, title: "Call Us", desc: "For urgent inquiries", action: "+1 (555) 123-4567" }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all text-center"
                        >
                            <div className="w-14 h-14 bg-tea-50 text-tea-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <item.icon size={24} />
                            </div>
                            <h3 className="font-bold text-tea-900 mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-500 mb-4 font-medium">{item.desc}</p>
                            <button className="text-tea-700 font-bold text-sm hover:underline">{item.action}</button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-serif font-bold text-tea-900 mb-8 pl-4 border-l-4 border-tea-500">Frequently Asked Questions</h2>

                    <div className="space-y-4">
                        <FaqItem
                            question="Where does your tea come from?"
                            answer="We source our teas directly from small, sustainable estates in India, Japan, China, and Sri Lanka. We have personal relationships with every farmer."
                            icon={Package}
                        />
                        <FaqItem
                            question="What is your return policy?"
                            answer="We want you to love your tea. If you're not satisfied, we accept returns on unopened packages within 30 days. For opened tea, reach out to us and we'll make it right."
                            icon={Truck}
                        />
                        <FaqItem
                            question="Do you ship internationally?"
                            answer="Yes! We ship to over 50 countries. Shipping rates are calculated at checkout based on weight and destination."
                            icon={CreditCard}
                        />
                        <FaqItem
                            question="How should I store my tea?"
                            answer="Keep your tea in a cool, dark, and dry place. Our resealable pouches are perfect for maintaining freshness for up to 12 months."
                            icon={HelpCircle}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const FaqItem = ({ question, answer, icon: Icon }: { question: string, answer: string, icon: any }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-tea-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                        <Icon size={20} />
                    </div>
                    <span className="font-bold text-tea-900">{question}</span>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0 }}
                className="overflow-hidden"
            >
                <div className="p-6 pt-0 text-gray-600 leading-relaxed font-medium pl-20">
                    {answer}
                </div>
            </motion.div>
        </div>
    );
};

export default SupportPage;
