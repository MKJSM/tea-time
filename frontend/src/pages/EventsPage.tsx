import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Calendar, Users, Coffee, Star,
    MapPin, CheckCircle, Loader2, Clock,
    Minus, Plus, Sparkles, Package, Phone, FileText
} from 'lucide-react';
import { useGetProductsPaginatedQuery } from '../features/products/productsApi';
import { useCreateEventBookingMutation, EventSelectedItem } from '../features/events/eventsApi';
import { useAppSelector } from '../store/hooks';
import { formatPrice } from '../utils/format';
import toast from 'react-hot-toast';

// ─── Constants ──────────────────────────────────────────────────────────────

const FLASK_DEPOSIT_PER_UNIT = 50;   // ₹50 per flask/hot drink
const DELIVERY_CHARGE = 200;          // Flat delivery fee
const TAX_RATE = 0.05;                // 5% GST

const EVENT_TYPES = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'birthday', label: 'Birthday Party' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'conference', label: 'Conference / Seminar' },
    { value: 'other', label: 'Other Celebration' },
];

const TIME_SLOTS = [
    { value: 'morning', label: '☀️ Morning (7am – 12pm)' },
    { value: 'afternoon', label: '🌤 Afternoon (12pm – 5pm)' },
    { value: 'evening', label: '🌙 Evening (5pm – 10pm)' },
];

const STEPS = [
    { id: 1, label: 'Event Details', icon: Calendar },
    { id: 2, label: 'Headcount', icon: Users },
    { id: 3, label: 'Menu', icon: Coffee },
    { id: 4, label: 'Quote', icon: Star },
    { id: 5, label: 'Confirm', icon: CheckCircle },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    eventName: string;
    eventType: string;
    eventDate: string;
    timeSlot: string;
    venueAddress: string;
    headcountTotal: number;
    headcountAdults: number;
    headcountKids: number;
    headcountSeniors: number;
    notes: string;
}

// Local definition avoids import resolution issues for Object.values typing
interface SelectedItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

type SelectedItemsMap = Record<string, SelectedItem>;

const initialForm: FormState = {
    contactName: '', contactPhone: '', contactEmail: '',
    eventName: '', eventType: '', eventDate: '', timeSlot: '',
    venueAddress: '', notes: '',
    headcountTotal: 0, headcountAdults: 0, headcountKids: 0, headcountSeniors: 0,
};

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputBase = 'w-full px-4 py-3 rounded-xl border border-tea-200 bg-white text-tea-900 placeholder-tea-400 focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-tea-500 transition-all text-sm';
const labelBase = 'block text-xs font-bold text-tea-800 uppercase tracking-widest mb-1.5';
const sectionCard = 'bg-white rounded-2xl border border-tea-100 p-6 shadow-sm';

// ─── Component ───────────────────────────────────────────────────────────────

const EventsPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormState>(initialForm);
    const [selectedItems, setSelectedItems] = useState<SelectedItemsMap>({});
    const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

    const { isAuthenticated } = useAppSelector((s) => s.auth);
    const [createBooking, { isLoading: isSubmitting }] = useCreateEventBookingMutation();

    // Fetch products for menu selection
    const { data: productsData, isLoading: isLoadingProducts } = useGetProductsPaginatedQuery(
        { page: 1, limit: 50 },
        { skip: step !== 3 }
    );

    // ── Handlers ──────────────────────────────────────────────────────────────

    const setField = (key: keyof FormState, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const adjustQty = (item: any, delta: number) => {
        setSelectedItems((prev) => {
            const existing = prev[item.id];
            const newQty = (existing?.quantity ?? 0) + delta;
            if (newQty <= 0) {
                const next = { ...prev };
                delete next[item.id];
                return next;
            }
            return {
                ...prev,
                [item.id]: {
                    product_id: item.id,
                    product_name: item.name,
                    quantity: newQty,
                    unit_price: item.price,
                },
            };
        });
    };

    // ── Quote calculation ────────────────────────────────────────────────────

    const quote = useMemo(() => {
        const items = Object.values(selectedItems) as SelectedItem[];
        const base = items.reduce((sum: number, i: SelectedItem) => sum + i.unit_price * i.quantity, 0);
        // Flask deposit: count hot drink items (non-zero qty)
        const flaskCount = items.filter(i => i.quantity > 0).length;
        const deposit = flaskCount * FLASK_DEPOSIT_PER_UNIT;
        const delivery = base > 0 ? DELIVERY_CHARGE : 0;
        const tax = (base + delivery) * TAX_RATE;
        const total = base + deposit + delivery + tax;
        return { base, deposit, delivery, tax, total };
    }, [selectedItems]);

    // ── Validation ───────────────────────────────────────────────────────────

    const isStep1Valid =
        form.contactName.trim() &&
        form.contactPhone.trim().length >= 10 &&
        form.contactEmail.includes('@') &&
        form.eventName.trim() &&
        form.eventType &&
        form.eventDate &&
        form.timeSlot &&
        form.venueAddress.trim();

    const isStep2Valid =
        form.headcountTotal > 0 &&
        form.headcountAdults + form.headcountKids + form.headcountSeniors === form.headcountTotal;

    const isStep3Valid = true; // Selection is optional, user can Skip

    const handleSubmit = async () => {
        try {
            const res = await createBooking({
                contact_name: form.contactName,
                contact_phone: form.contactPhone,
                contact_email: form.contactEmail,
                event_name: form.eventName,
                event_type: form.eventType,
                event_date: form.eventDate,
                time_slot: form.timeSlot,
                venue_address: form.venueAddress,
                headcount_total: form.headcountTotal,
                headcount_adults: form.headcountAdults,
                headcount_kids: form.headcountKids,
                headcount_seniors: form.headcountSeniors,
                selected_items: Object.values(selectedItems),
                estimated_base: quote.base,
                estimated_deposit: quote.deposit,
                estimated_delivery: quote.delivery,
                estimated_tax: quote.tax,
                estimated_total: quote.total,
                notes: form.notes || undefined,
            }).unwrap();
            setConfirmedBooking(res);
            setStep(5);
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to submit booking. Please try again.');
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-cream">
            <section className="relative min-h-[60vh] flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-tea-900 via-tea-950 to-tea-900" />
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(35,80%,55%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(150,35%,80%) 0%, transparent 40%)'
                    }} />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-30" />
                </div>

                <div className="max-w-5xl mx-auto px-4 relative z-10 w-full animate-fadeIn">
                    <Link to="/" className="inline-flex items-center gap-2 text-tea-200 hover:text-white mb-10 transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <div className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
                        <Sparkles size={14} className="text-accent-400" />
                        <span className="text-accent-300 text-[10px] font-bold uppercase tracking-widest">Premium Event Service</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-6 leading-tight">
                        Tea Catering<br />
                        <span className="text-accent-400 italic">for Your Event</span>
                    </h1>
                    <p className="text-tea-100 text-xl max-w-2xl font-light leading-relaxed">
                        From corporate gatherings to grand weddings, we bring the ritual of tea to your special moments.
                        Tell us about your event and get an instant quote.
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-24 border-y border-tea-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-tea-900 mb-4 italic">Experience the Extraordinary</h2>
                        <p className="text-tea-600 max-w-2xl mx-auto">We don't just serve tea; we create immersive sensory experiences that leave lasting impressions on your guests.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: 'Handcrafted Blends', desc: 'Sourced from the finest estates in India and blended by hand for every order.', icon: <Sparkles className="text-accent-500" size={24} /> },
                            { title: 'Live Tea Bar', desc: 'Our experts serve hot and cold tea live, ensuring the perfect temperature and aroma.', icon: <Clock className="text-accent-500" size={24} /> },
                            { title: 'Sustainable Elegance', desc: 'Eco-friendly packaging and premium glass setups that look as good as they taste.', icon: <Star className="text-accent-500" size={24} /> }
                        ].map((feat, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl hover:bg-tea-50 transition-all duration-300 group border border-transparent hover:border-tea-100">
                                <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                                    {feat.icon}
                                </div>
                                <h3 className="text-xl font-bold text-tea-900 mb-3">{feat.title}</h3>
                                <p className="text-tea-600 text-sm leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main */}
            <div className="max-w-4xl mx-auto px-4 py-20">

                {step < 5 && (
                    <>
                        {/* Progress Bar */}
                        <div className="flex items-center justify-between mb-10 relative">
                            <div className="absolute left-0 right-0 top-5 h-0.5 bg-tea-100" />
                            <div
                                className="absolute left-0 top-5 h-0.5 bg-gradient-to-r from-tea-700 to-accent-500 transition-all duration-500"
                                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                            />
                            {STEPS.filter(s => s.id < 5).map((s) => {
                                const StepIcon = s.icon;
                                const done = step > s.id;
                                const active = step === s.id;
                                return (
                                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-1">
                                        <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center border-2 transition-all ${done ? 'bg-tea-700 border-tea-700 text-white' : active ? 'bg-white border-tea-700 text-tea-700' : 'bg-white border-tea-200 text-tea-300'}`}>
                                            {done ? <CheckCircle size={18} /> : <StepIcon size={18} />}
                                            <span className="text-[10px] font-bold leading-none mt-0.5">{s.id}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${active ? 'text-tea-800' : done ? 'text-tea-600' : 'text-tea-300'}`}>{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Step Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* ── STEP 1: Event Details ──────────────────────────────── */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-tea-900 mb-1">Event Details</h2>
                                            <p className="text-tea-600 text-sm">Tell us about you and your event.</p>
                                        </div>

                                        <div className={sectionCard}>
                                            <h3 className="text-sm font-bold text-tea-800 mb-4 flex items-center gap-2"><Phone size={14} /> Your Contact</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="contactName" className={labelBase}>Full Name *</label>
                                                    <input id="contactName" className={inputBase} placeholder="Arjun Sharma" value={form.contactName} onChange={e => setField('contactName', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label htmlFor="contactPhone" className={labelBase}>Phone *</label>
                                                    <input id="contactPhone" className={inputBase} type="tel" placeholder="9876543210" value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label htmlFor="contactEmail" className={labelBase}>Email *</label>
                                                    <input id="contactEmail" className={inputBase} type="email" placeholder="arjun@example.com" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className={sectionCard}>
                                            <h3 className="text-sm font-bold text-tea-800 mb-4 flex items-center gap-2"><Calendar size={14} /> Event Info</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="eventName" className={labelBase}>Event Name *</label>
                                                    <input id="eventName" className={inputBase} placeholder="Sharma Wedding Reception" value={form.eventName} onChange={e => setField('eventName', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label htmlFor="eventType" className={labelBase}>Event Type *</label>
                                                    <select id="eventType" className={inputBase} value={form.eventType} onChange={e => setField('eventType', e.target.value)}>
                                                        <option value="">Select type...</option>
                                                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor="eventDate" className={labelBase}>Event Date *</label>
                                                    <input id="eventDate" className={inputBase} type="date" min={new Date().toISOString().split('T')[0]} value={form.eventDate} onChange={e => setField('eventDate', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label htmlFor="timeSlot" className={labelBase}>Time Slot *</label>
                                                    <select id="timeSlot" className={inputBase} value={form.timeSlot} onChange={e => setField('timeSlot', e.target.value)}>
                                                        <option value="">Select slot...</option>
                                                        {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label htmlFor="venueAddress" className={labelBase}><MapPin size={12} className="inline mr-1" />Venue / Delivery Address *</label>
                                                    <textarea id="venueAddress" className={inputBase + ' resize-none'} rows={2} placeholder="123 MG Road, Bangalore, Karnataka 560001" value={form.venueAddress} onChange={e => setField('venueAddress', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!isStep1Valid}
                                            className="w-full py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-tea-900/10"
                                            aria-label="Next step"
                                        >
                                            Next: Headcount <ArrowRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* ── STEP 2: Headcount ─────────────────────────────────── */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-tea-900 mb-1">Headcount</h2>
                                            <p className="text-tea-600 text-sm">Total guests and age breakdown.</p>
                                        </div>

                                        <div className={sectionCard + ' space-y-6'}>
                                            {/* Total */}
                                            <div>
                                                <label htmlFor="headcountTotal" className={labelBase}>Total Guests *</label>
                                                <input
                                                    id="headcountTotal"
                                                    type="number"
                                                    min={1}
                                                    className={inputBase + ' text-lg font-bold'}
                                                    placeholder="100"
                                                    value={form.headcountTotal || ''}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setField('headcountTotal', val);
                                                        setField('headcountAdults', 0);
                                                        setField('headcountKids', 0);
                                                        setField('headcountSeniors', 0);
                                                    }}
                                                />
                                            </div>

                                            {form.headcountTotal > 0 && (
                                                <>
                                                    <p className="text-xs text-tea-600 font-medium">Now break it down (must add up to {form.headcountTotal}):</p>
                                                    {[
                                                        { key: 'headcountAdults', label: 'Adults (18–59)', ariaLabelPrefix: 'Adults' },
                                                        { key: 'headcountKids', label: 'Children (under 18)', ariaLabelPrefix: 'Children' },
                                                        { key: 'headcountSeniors', label: 'Senior Citizens (60+)', ariaLabelPrefix: 'Senior Citizens' },
                                                    ].map(({ key, label, ariaLabelPrefix }) => (
                                                        <div key={key} className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-tea-800">{label}</span>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setField(key as keyof FormState, Math.max(0, (form[key as keyof FormState] as number) - 1))}
                                                                    className="w-9 h-9 rounded-full border border-tea-200 flex items-center justify-center hover:bg-tea-50 transition-colors"
                                                                    aria-label={`Decrease ${ariaLabelPrefix} headcount`}
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <div className="w-10 text-center font-bold text-tea-900">{form[key as keyof FormState] as number}</div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setField(key as keyof FormState, (form[key as keyof FormState] as number) + 1)}
                                                                    className="w-9 h-9 rounded-full border border-tea-200 flex items-center justify-center hover:bg-tea-50 transition-colors"
                                                                    aria-label={`Increase ${ariaLabelPrefix} headcount`}
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Running total */}
                                                    <div className={`flex justify-between p-3 rounded-xl text-sm font-bold ${form.headcountAdults + form.headcountKids + form.headcountSeniors === form.headcountTotal
                                                        ? 'bg-tea-50 text-tea-700'
                                                        : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        <span>Sum of breakdown</span>
                                                        <span>{form.headcountAdults + form.headcountKids + form.headcountSeniors} / {form.headcountTotal}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            <button onClick={() => setStep(1)} className="flex-1 py-4 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all flex items-center justify-center gap-2">
                                                <ArrowLeft size={18} /> Back
                                            </button>
                                            <button
                                                onClick={() => setStep(3)}
                                                disabled={!isStep2Valid}
                                                className="flex-[2] py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-tea-900/10"
                                                aria-label="Next step"
                                            >
                                                Next: Menu <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 3: Product Selection ──────────────────────────── */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-tea-900 mb-1">Select Menu Items</h2>
                                            <p className="text-tea-600 text-sm">Choose what you'd like served. Use quantities per serving.</p>
                                        </div>

                                        {isLoadingProducts ? (
                                            <div className="flex justify-center py-20">
                                                <Loader2 className="animate-spin text-tea-600" size={32} />
                                            </div>
                                        ) : (
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {(productsData?.data || []).map((product) => {
                                                    const qty = selectedItems[product.id]?.quantity ?? 0;
                                                    return (
                                                        <div key={product.id} className="bg-white rounded-2xl border border-tea-100 p-4 flex gap-4 items-center hover:border-tea-300 transition-all shadow-sm">
                                                            <img
                                                                src={product.image || '/placeholder-tea.jpg'}
                                                                alt={product.name}
                                                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-tea-900 text-sm leading-tight line-clamp-2">{product.name}</p>
                                                                <p className="text-accent-600 font-bold text-sm mt-1">{formatPrice(product.price)}<span className="text-tea-400 font-normal text-xs">/unit</span></p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {qty > 0 ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => adjustQty(product, -1)}
                                                                            className="w-8 h-8 rounded-full bg-tea-50 border border-tea-200 flex items-center justify-center hover:bg-tea-100 transition-colors"
                                                                            aria-label={`Decrease ${product.name}`}
                                                                        >
                                                                            <Minus size={12} />
                                                                        </button>
                                                                        <span className="w-6 text-center font-bold text-tea-900 text-sm">{qty}</span>
                                                                        <button
                                                                            onClick={() => adjustQty(product, 1)}
                                                                            className="w-8 h-8 rounded-full bg-tea-700 text-white flex items-center justify-center hover:bg-tea-800 transition-colors"
                                                                            aria-label={`Increase ${product.name}`}
                                                                        >
                                                                            <Plus size={12} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => adjustQty(product, 1)}
                                                                        className="px-3 py-1.5 bg-tea-700 text-white text-xs font-bold rounded-lg hover:bg-tea-800 transition-colors"
                                                                        aria-label={`Add ${product.name}`}
                                                                    >
                                                                        Add
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {Object.keys(selectedItems).length > 0 && (
                                            <div className="bg-tea-50 rounded-2xl p-4 border border-tea-100">
                                                <p className="text-xs text-tea-600 font-bold uppercase tracking-widest mb-2">Selected: {Object.keys(selectedItems).length} item types</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(Object.values(selectedItems) as SelectedItem[]).map(item => (
                                                        <span key={item.product_id} className="text-xs bg-tea-700 text-white rounded-full px-3 py-1 font-medium">
                                                            {item.product_name} ×{item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button onClick={() => setStep(2)} className="flex-1 py-4 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all flex items-center justify-center gap-2">
                                                <ArrowLeft size={18} /> Back
                                            </button>
                                            <button
                                                onClick={() => setStep(4)}
                                                className="flex-[2] py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all flex items-center justify-center gap-2"
                                                aria-label={Object.keys(selectedItems).length > 0 ? "See Quote" : "Skip"}
                                            >
                                                {Object.keys(selectedItems).length > 0 ? 'See Quote' : 'Skip'} <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 4: Quote ─────────────────────────────────────── */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-tea-900 mb-1">Your Quote</h2>
                                            <p className="text-tea-600 text-sm">Estimated pricing based on your details.</p>
                                        </div>

                                        <div className="bg-tea-900 text-white rounded-3xl p-8 shadow-2xl">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-accent-500/20 rounded-xl flex items-center justify-center">
                                                    <Package size={20} className="text-accent-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg">{form.eventName}</p>
                                                    <p className="text-tea-400 text-xs">{form.eventDate} · {TIME_SLOTS.find(t => t.value === form.timeSlot)?.label}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-6 pb-6 border-b border-white/10 max-h-40 overflow-y-auto">
                                                {(Object.values(selectedItems) as SelectedItem[]).map(item => (
                                                    <div key={item.product_id} className="flex justify-between text-xs">
                                                        <span className="text-tea-300">{item.product_name} ×{item.quantity}</span>
                                                        <span className="text-white font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-sm text-tea-300">
                                                    <span>Product Subtotal</span>
                                                    <span>{formatPrice(quote.base)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-tea-300">
                                                    <span>Security Deposit</span>
                                                    <span>{formatPrice(quote.deposit)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-tea-300">
                                                    <span>Delivery & Service</span>
                                                    <span>{formatPrice(quote.delivery)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-tea-400">
                                                    <span>GST (5%)</span>
                                                    <span>{formatPrice(quote.tax)}</span>
                                                </div>
                                                <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                                                    <span>Estimated Total</span>
                                                    <span className="text-accent-400">{formatPrice(quote.total)}</span>
                                                </div>
                                            </div>

                                            <p className="text-tea-400 text-xs text-center">
                                                * Final invoice will be shared after confirmation call.
                                            </p>
                                        </div>

                                        <div className={sectionCard}>
                                            <label className={labelBase}><FileText size={12} className="inline mr-1" />Special Requirements (optional)</label>
                                            <textarea
                                                className={inputBase + ' resize-none'}
                                                rows={3}
                                                placeholder="Any specific requests..."
                                                value={form.notes}
                                                onChange={e => setField('notes', e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <button onClick={() => setStep(3)} className="flex-1 py-4 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all flex items-center justify-center gap-2">
                                                <ArrowLeft size={18} /> Back
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-[2] py-4 bg-gradient-to-r from-tea-800 to-tea-700 text-white font-bold rounded-2xl hover:from-tea-900 hover:to-tea-800 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                                                aria-label="Send Enquiry"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                {isSubmitting ? 'Submitting...' : 'Send Enquiry'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}

                {/* ── STEP 5: Confirmation ───────────────────────────────────── */}
                {step === 5 && confirmedBooking && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-24 h-24 bg-tea-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-tea-100">
                            <CheckCircle size={48} className="text-tea-700" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-tea-900 mb-3">You're all set!</h2>
                        <p className="text-tea-600 text-lg mb-2">Booking received for {confirmedBooking.event_name}.</p>
                        <div className="inline-block bg-accent-50 border border-accent-200 rounded-2xl px-6 py-4 mb-6">
                            <p className="text-accent-700 font-bold text-sm">⏰ Our team will call you within <span className="text-accent-600 text-base">30–60 minutes</span></p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/event-bookings" className="px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors">
                                View My Bookings
                            </Link>
                            <button
                                onClick={() => { setStep(1); setForm(initialForm); setSelectedItems({}); setConfirmedBooking(null); }}
                                className="px-8 py-3 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-colors"
                            >
                                Book Another
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
