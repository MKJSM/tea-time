import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Calendar, Users, Coffee, Star,
    MapPin, CheckCircle, Loader2,
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

    const isStep3Valid = Object.keys(selectedItems).length > 0;

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
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-tea-900 via-tea-800 to-tea-700 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(35,80%,55%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(150,35%,80%) 0%, transparent 40%)'
                }} />
                <div className="max-w-5xl mx-auto px-4 relative">
                    <Link to="/" className="inline-flex items-center gap-2 text-tea-200 hover:text-white mb-8 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <div className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 rounded-full px-4 py-1 mb-4">
                        <Sparkles size={14} className="text-accent-400" />
                        <span className="text-accent-300 text-xs font-bold uppercase tracking-widest">Bulk & Event Catering</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 leading-tight">
                        Tea Catering<br />
                        <span className="text-accent-400">for Your Event</span>
                    </h1>
                    <p className="text-tea-200 text-lg max-w-2xl">
                        Weddings, corporate events, birthdays — we bring premium handcrafted tea to every occasion.
                        Fill in the details and we'll call you within <strong className="text-white">30–60 minutes</strong> to confirm.
                    </p>
                </div>
            </section>

            {/* Main */}
            <div className="max-w-4xl mx-auto px-4 py-12">

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
                                const Icon = s.icon;
                                const done = step > s.id;
                                const active = step === s.id;
                                return (
                                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-tea-700 border-tea-700 text-white' : active ? 'bg-white border-tea-700 text-tea-700' : 'bg-white border-tea-200 text-tea-300'}`}>
                                            {done ? <CheckCircle size={18} /> : <Icon size={18} />}
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
                                                    <label className={labelBase}>Full Name *</label>
                                                    <input className={inputBase} placeholder="Arjun Sharma" value={form.contactName} onChange={e => setField('contactName', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className={labelBase}>Phone *</label>
                                                    <input className={inputBase} type="tel" placeholder="9876543210" value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className={labelBase}>Email *</label>
                                                    <input className={inputBase} type="email" placeholder="arjun@example.com" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className={sectionCard}>
                                            <h3 className="text-sm font-bold text-tea-800 mb-4 flex items-center gap-2"><Calendar size={14} /> Event Info</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelBase}>Event Name *</label>
                                                    <input className={inputBase} placeholder="Sharma Wedding Reception" value={form.eventName} onChange={e => setField('eventName', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className={labelBase}>Event Type *</label>
                                                    <select className={inputBase} value={form.eventType} onChange={e => setField('eventType', e.target.value)}>
                                                        <option value="">Select type...</option>
                                                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelBase}>Event Date *</label>
                                                    <input className={inputBase} type="date" min={new Date().toISOString().split('T')[0]} value={form.eventDate} onChange={e => setField('eventDate', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className={labelBase}>Time Slot *</label>
                                                    <select className={inputBase} value={form.timeSlot} onChange={e => setField('timeSlot', e.target.value)}>
                                                        <option value="">Select slot...</option>
                                                        {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className={labelBase}><MapPin size={12} className="inline mr-1" />Venue / Delivery Address *</label>
                                                    <textarea className={inputBase + ' resize-none'} rows={2} placeholder="123 MG Road, Bangalore, Karnataka 560001" value={form.venueAddress} onChange={e => setField('venueAddress', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!isStep1Valid}
                                            className="w-full py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                                <label className={labelBase}>Total Guests *</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className={inputBase + ' text-lg font-bold'}
                                                    placeholder="100"
                                                    value={form.headcountTotal || ''}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setField('headcountTotal', val);
                                                        // Reset breakdown when total changes
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
                                                        { key: 'headcountAdults', label: 'Adults (18–59)' },
                                                        { key: 'headcountKids', label: 'Children (under 18)' },
                                                        { key: 'headcountSeniors', label: 'Senior Citizens (60+)' },
                                                    ].map(({ key, label }) => (
                                                        <div key={key} className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-tea-800">{label}</span>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => setField(key as keyof FormState, Math.max(0, (form[key as keyof FormState] as number) - 1))}
                                                                    className="w-9 h-9 rounded-full border border-tea-200 flex items-center justify-center hover:bg-tea-50 transition-colors"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="w-10 text-center font-bold text-tea-900">{form[key as keyof FormState] as number}</span>
                                                                <button
                                                                    onClick={() => setField(key as keyof FormState, (form[key as keyof FormState] as number) + 1)}
                                                                    className="w-9 h-9 rounded-full border border-tea-200 flex items-center justify-center hover:bg-tea-50 transition-colors"
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
                                                className="flex-[2] py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                                                        <button onClick={() => adjustQty(product, -1)} className="w-8 h-8 rounded-full bg-tea-50 border border-tea-200 flex items-center justify-center hover:bg-tea-100 transition-colors">
                                                                            <Minus size={12} />
                                                                        </button>
                                                                        <span className="w-6 text-center font-bold text-tea-900 text-sm">{qty}</span>
                                                                        <button onClick={() => adjustQty(product, 1)} className="w-8 h-8 rounded-full bg-tea-700 text-white flex items-center justify-center hover:bg-tea-800 transition-colors">
                                                                            <Plus size={12} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button onClick={() => adjustQty(product, 1)} className="px-3 py-1.5 bg-tea-700 text-white text-xs font-bold rounded-lg hover:bg-tea-800 transition-colors">
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
                                                disabled={!isStep3Valid}
                                                className="flex-[2] py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                See Quote <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 4: Quote ─────────────────────────────────────── */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-tea-900 mb-1">Your Approximate Quote</h2>
                                            <p className="text-tea-600 text-sm">Final pricing will be confirmed by our team during the call.</p>
                                        </div>

                                        {/* Summary card */}
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

                                            {/* Items */}
                                            <div className="space-y-2 mb-6 pb-6 border-b border-white/10 max-h-40 overflow-y-auto">
                                                {(Object.values(selectedItems) as SelectedItem[]).map(item => (
                                                    <div key={item.product_id} className="flex justify-between text-xs">
                                                        <span className="text-tea-300">{item.product_name} ×{item.quantity}</span>
                                                        <span className="text-white font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pricing breakdown */}
                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-sm text-tea-300">
                                                    <span>Product Subtotal</span>
                                                    <span>{formatPrice(quote.base)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-tea-300">
                                                    <span>Flask Security Deposit</span>
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
                                                * Flask deposits are fully refundable on return. Final invoice issued after confirmation call.
                                            </p>
                                        </div>

                                        {/* Notes */}
                                        <div className={sectionCard}>
                                            <label className={labelBase}><FileText size={12} className="inline mr-1" />Special Requirements (optional)</label>
                                            <textarea
                                                className={inputBase + ' resize-none'}
                                                rows={3}
                                                placeholder="Dietary restrictions, preferred blends, themed setup requirements..."
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
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                {isSubmitting ? 'Submitting...' : 'Book My Event'}
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
                        <p className="text-tea-600 text-lg mb-2">Your booking request has been received.</p>
                        <div className="inline-block bg-accent-50 border border-accent-200 rounded-2xl px-6 py-4 mb-6">
                            <p className="text-accent-700 font-bold text-sm">⏰ Our team will call you within <span className="text-accent-600 text-base">30–60 minutes</span></p>
                            <p className="text-accent-600 text-xs mt-1">to confirm details and finalize the invoice.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-tea-100 p-6 mb-8 text-left max-w-sm mx-auto">
                            <p className="text-xs text-tea-500 font-bold uppercase tracking-widest mb-3">Booking Reference</p>
                            <p className="font-mono text-xs text-tea-700 break-all">{confirmedBooking.id}</p>
                            <div className="mt-4 pt-4 border-t border-tea-50 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-tea-500">Event</span>
                                    <span className="font-bold text-tea-900">{confirmedBooking.event_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-tea-500">Date</span>
                                    <span className="font-bold text-tea-900">{confirmedBooking.event_date}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-tea-500">Estimate</span>
                                    <span className="font-bold text-accent-600">{formatPrice(confirmedBooking.estimated_total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/" className="px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors">
                                Back to Home
                            </Link>
                            <button
                                onClick={() => { setStep(1); setForm(initialForm); setSelectedItems({}); setConfirmedBooking(null); }}
                                className="px-8 py-3 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-colors"
                            >
                                Book Another Event
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Trust signals */}
                {step < 5 && (
                    <div className="mt-12 pt-8 border-t border-tea-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                            {[
                                { number: '500+', label: 'Events Served' },
                                { number: '4.9★', label: 'Average Rating' },
                                { number: '10K+', label: 'Happy Guests' },
                                { number: '30–60 min', label: 'Callback Time' },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div className="text-2xl font-serif font-bold text-tea-700">{s.number}</div>
                                    <div className="text-xs text-tea-500 font-medium mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
