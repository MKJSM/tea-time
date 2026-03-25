import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Users, MapPin, Clock, Package,
    CheckCircle, XCircle, AlertCircle, Phone, Mail,
    Coffee, Star, Edit2, Minus, Plus, Loader2, X,
} from 'lucide-react';
import {
    useGetEventBookingByIdQuery,
    useEditEventBookingMutation,
    EditEventBookingRequest,
    EventSelectedItem,
} from '../features/events/eventsApi';
import { useGetProductsPaginatedQuery } from '../features/products/productsApi';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthModalOpen } from '../features/auth/authSlice';
import { TeaLoader } from '../components/common/TeaLoader';
import { formatPrice } from '../utils/format';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────────────────────

const FLASK_DEPOSIT_PER_UNIT = 50;
const DELIVERY_CHARGE = 200;
const TAX_RATE = 0.05;

const TIME_SLOTS = [
    { value: 'morning', label: '☀️ Morning (7am–12pm)' },
    { value: 'afternoon', label: '🌤 Afternoon (12pm–5pm)' },
    { value: 'evening', label: '🌙 Evening (5pm–10pm)' },
];

const TIME_SLOT_LABELS: Record<string, string> = Object.fromEntries(TIME_SLOTS.map(t => [t.value, t.label]));

const EVENT_TYPE_LABELS: Record<string, string> = {
    wedding: 'Wedding', corporate: 'Corporate Event', birthday: 'Birthday Party',
    anniversary: 'Anniversary', conference: 'Conference / Seminar', other: 'Other Celebration',
};

// ─── Status config ────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

const STATUS_CONFIG: Record<BookingStatus, { label: string; bgColor: string; icon: React.ReactNode; description: string }> = {
    pending: {
        label: 'Pending Confirmation',
        bgColor: 'bg-amber-700',
        icon: <Clock size={20} />,
        description: 'Your booking is received. Our team will call you within 30–60 minutes to confirm.',
    },
    confirmed: {
        label: 'Confirmed',
        bgColor: 'bg-emerald-700',
        icon: <CheckCircle size={20} />,
        description: 'Your event is confirmed! Products are reserved and our team will handle the setup.',
    },
    cancelled: {
        label: 'Cancelled',
        bgColor: 'bg-red-700',
        icon: <XCircle size={20} />,
        description: 'This booking has been cancelled.',
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function LabelValue({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            {icon && <div className="text-tea-400 mt-0.5 flex-shrink-0">{icon}</div>}
            <div>
                <p className="text-[10px] text-tea-400 font-bold uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-tea-800 text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
    booking: any;
    onClose: () => void;
    onSaved: () => void;
}

type SelectedItemsMap = Record<string, EventSelectedItem>;

function EditPanel({ booking, onClose, onSaved }: EditPanelProps) {
    const [eventDate, setEventDate] = useState<string>(booking.event_date ?? '');
    const [timeSlot, setTimeSlot] = useState<string>(booking.time_slot ?? '');
    const [venueAddress, setVenueAddress] = useState<string>(booking.venue_address ?? '');
    const [headcountTotal, setHeadcountTotal] = useState<number>(booking.headcount_total ?? 1);
    const [headcountAdults, setHeadcountAdults] = useState<number>(booking.headcount_adults ?? 0);
    const [headcountKids, setHeadcountKids] = useState<number>(booking.headcount_kids ?? 0);
    const [notes, setNotes] = useState<string>(booking.notes ?? '');

    // Initialise selected items from existing booking
    const [selectedItems, setSelectedItems] = useState<SelectedItemsMap>(() => {
        const map: SelectedItemsMap = {};
        const items: EventSelectedItem[] = Array.isArray(booking.selected_items) ? booking.selected_items : [];
        items.forEach(item => { map[item.product_id] = { ...item }; });
        return map;
    });

    const { data: productsData, isLoading: isLoadingProducts } = useGetProductsPaginatedQuery(
        { page: 1, limit: 50 },
        { skip: false }
    );

    const [editBooking, { isLoading: isSaving }] = useEditEventBookingMutation();

    const adjustQty = (product: any, delta: number) => {
        setSelectedItems(prev => {
            const existing = prev[product.id];
            const newQty = (existing?.quantity ?? 0) + delta;
            if (newQty <= 0) {
                const next = { ...prev };
                delete next[product.id];
                return next;
            }
            return {
                ...prev,
                [product.id]: {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: newQty,
                    unit_price: product.price,
                },
            };
        });
    };

    const quote = useMemo(() => {
        const items = Object.values(selectedItems) as EventSelectedItem[];
        const base = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
        const deposit = items.filter(i => i.quantity > 0).length * FLASK_DEPOSIT_PER_UNIT;
        const delivery = base > 0 ? DELIVERY_CHARGE : 0;
        const tax = (base + delivery) * TAX_RATE;
        return { base, deposit, delivery, tax, total: base + deposit + delivery + tax };
    }, [selectedItems]);

    const headcountValid = headcountTotal > 0 && headcountAdults + headcountKids === headcountTotal;

    const handleSave = async () => {
        if (!headcountValid) {
            toast.error('Guest breakdown must add up to total guests');
            return;
        }
        const body: EditEventBookingRequest = {
            event_date: eventDate || undefined,
            time_slot: timeSlot || undefined,
            venue_address: venueAddress || undefined,
            headcount_total: headcountTotal,
            headcount_adults: headcountAdults,
            headcount_kids: headcountKids,
            selected_items: Object.values(selectedItems),
            estimated_base: quote.base,
            estimated_deposit: quote.deposit,
            estimated_delivery: quote.delivery,
            estimated_tax: quote.tax,
            estimated_total: quote.total,
            notes: notes || undefined,
        };
        try {
            await editBooking({ id: booking.id, body }).unwrap();
            toast.success('Booking updated!');
            onSaved();
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to update booking');
        }
    };

    const inputBase = 'w-full px-4 py-3 rounded-xl border border-tea-200 bg-white text-tea-900 placeholder-tea-400 focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-tea-500 transition-all text-sm';
    const labelBase = 'block text-xs font-bold text-tea-800 uppercase tracking-widest mb-1.5';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-tea-100">
                    <div>
                        <h2 className="text-lg font-bold text-tea-900">Edit Booking</h2>
                        <p className="text-tea-500 text-xs mt-0.5">Changes apply while booking is pending</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-tea-50 flex items-center justify-center transition-colors">
                        <X size={18} className="text-tea-500" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6">

                    {/* Date & Time */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelBase}>Event Date</label>
                            <input
                                type="date"
                                className={inputBase}
                                min={new Date().toISOString().split('T')[0]}
                                value={eventDate}
                                onChange={e => setEventDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelBase}>Time Slot</label>
                            <select className={inputBase} value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                                <option value="">Select slot...</option>
                                {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelBase}>Venue / Delivery Address</label>
                            <textarea
                                className={inputBase + ' resize-none'}
                                rows={2}
                                value={venueAddress}
                                onChange={e => setVenueAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Headcount */}
                    <div className="bg-tea-50 rounded-2xl p-5 space-y-4">
                        <div>
                            <label className={labelBase}>Total Guests</label>
                            <input
                                type="number"
                                min={1}
                                className={inputBase + ' font-bold'}
                                value={headcountTotal || ''}
                                onChange={e => {
                                    const v = parseInt(e.target.value) || 0;
                                    setHeadcountTotal(v);
                                    setHeadcountAdults(0);
                                    setHeadcountKids(0);
                                }}
                            />
                        </div>
                        {headcountTotal > 0 && (
                            <>
                                {[
                                    { key: 'adults', label: 'Adults (18+)', val: headcountAdults, set: setHeadcountAdults },
                                    { key: 'kids', label: 'Children (under 18)', val: headcountKids, set: setHeadcountKids },
                                ].map(({ key, label, val, set }) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-tea-800">{label}</span>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => set(Math.max(0, val - 1))}
                                                className="w-9 h-9 rounded-full border border-tea-200 bg-white flex items-center justify-center hover:bg-tea-100 transition-colors">
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center font-bold text-tea-900">{val}</span>
                                            <button type="button" onClick={() => set(val + 1)}
                                                className="w-9 h-9 rounded-full border border-tea-200 bg-white flex items-center justify-center hover:bg-tea-100 transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className={`flex justify-between p-3 rounded-xl text-sm font-bold ${headcountAdults + headcountKids === headcountTotal ? 'bg-tea-100 text-tea-700' : 'bg-red-50 text-red-600'}`}>
                                    <span>Sum</span>
                                    <span>{headcountAdults + headcountKids} / {headcountTotal}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Menu */}
                    <div>
                        <h3 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Coffee size={13} /> Menu Items</h3>
                        {isLoadingProducts ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-tea-500" size={24} /></div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {(productsData?.data || []).map((product: any) => {
                                    const qty = selectedItems[product.id]?.quantity ?? 0;
                                    return (
                                        <div key={product.id} className={`bg-white rounded-xl border p-3 flex gap-3 items-center transition-all ${qty > 0 ? 'border-tea-400 shadow-sm' : 'border-tea-100'}`}>
                                            <img src={product.image || '/placeholder-tea.jpg'} alt={product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-tea-900 text-xs line-clamp-2">{product.name}</p>
                                                <p className="text-accent-600 text-xs font-bold">{formatPrice(product.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {qty > 0 ? (
                                                    <>
                                                        <button onClick={() => adjustQty(product, -1)} className="w-7 h-7 rounded-full bg-tea-50 border border-tea-200 flex items-center justify-center hover:bg-tea-100"><Minus size={11} /></button>
                                                        <span className="w-5 text-center font-bold text-tea-900 text-xs">{qty}</span>
                                                        <button onClick={() => adjustQty(product, 1)} className="w-7 h-7 rounded-full bg-tea-700 text-white flex items-center justify-center hover:bg-tea-800"><Plus size={11} /></button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => adjustQty(product, 1)} className="px-2.5 py-1 bg-tea-700 text-white text-xs font-bold rounded-lg hover:bg-tea-800">Add</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Updated Quote */}
                    <div className="bg-tea-900 text-white rounded-2xl p-5">
                        <p className="text-[10px] text-tea-400 font-bold uppercase tracking-widest mb-3">Updated Estimate</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-tea-300"><span>Subtotal</span><span>{formatPrice(quote.base)}</span></div>
                            <div className="flex justify-between text-tea-300"><span>Deposit + Delivery</span><span>{formatPrice(quote.deposit + quote.delivery)}</span></div>
                            <div className="flex justify-between text-tea-400 text-xs"><span>GST (5%)</span><span>{formatPrice(quote.tax)}</span></div>
                            <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10">
                                <span>Total</span><span className="text-accent-400">{formatPrice(quote.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelBase}>Special Requirements (optional)</label>
                        <textarea className={inputBase + ' resize-none'} rows={2} placeholder="Any updates or special requests..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-tea-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all text-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !headcountValid}
                        className="flex-[2] py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EventBookingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useAppSelector((s) => s.auth);
    const dispatch = useAppDispatch();
    const [editOpen, setEditOpen] = useState(false);

    const { data: booking, isLoading, error, refetch } = useGetEventBookingByIdQuery(id ?? '', {
        skip: !id || !isAuthenticated,
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border border-gray-100">
                    <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Authentication Required</h2>
                    <button onClick={() => dispatch(setAuthModalOpen(true))} className="px-10 py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-lg hover:bg-tea-950 transition-all">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) return <TeaLoader type="kettle" size="fullscreen" message="Loading booking details..." />;

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Booking Not Found</h2>
                    <Link to="/event-bookings" className="inline-block px-10 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all">My Bookings</Link>
                </div>
            </div>
        );
    }

    const status = booking.status as BookingStatus;
    const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const items: EventSelectedItem[] = Array.isArray(booking.selected_items) ? booking.selected_items : [];

    const formattedDate = booking.event_date
        ? new Date(booking.event_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    const formattedBookedOn = booking.created_at
        ? new Date(booking.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    return (
        <div className="min-h-screen bg-cream py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <Link to="/event-bookings" className="inline-flex items-center gap-2 text-tea-500 hover:text-tea-800 transition-colors text-sm font-bold uppercase tracking-widest mb-8">
                    <ArrowLeft size={16} /> My Bookings
                </Link>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Status Card */}
                    <div className={`${statusConfig.bgColor} rounded-3xl p-6 text-white shadow-xl`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 mb-3">
                                {statusConfig.icon}
                                <div>
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{EVENT_TYPE_LABELS[booking.event_type] ?? booking.event_type}</p>
                                    <h1 className="text-2xl font-serif font-bold">{booking.event_name}</h1>
                                </div>
                            </div>
                            {/* Edit button — only for pending */}
                            {booking.status === 'pending' && (
                                <button
                                    onClick={() => setEditOpen(true)}
                                    className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-4 py-2 text-white text-xs font-bold uppercase tracking-widest"
                                >
                                    <Edit2 size={13} /> Edit
                                </button>
                            )}
                        </div>
                        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-3">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">{statusConfig.label}</span>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">{statusConfig.description}</p>

                        {booking.status === 'cancelled' && booking.cancellation_reason && (
                            <div className="mt-4 bg-white/10 rounded-xl p-4 border border-white/20">
                                <p className="text-white/90 text-sm"><span className="font-bold">Reason:</span> {booking.cancellation_reason}</p>
                            </div>
                        )}
                    </div>

                    {/* Event Details */}
                    <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Calendar size={14} /> Event Details</h2>
                        <div className="grid grid-cols-2 gap-5">
                            <LabelValue label="Event Date" value={formattedDate} icon={<Calendar size={14} />} />
                            <LabelValue label="Time Slot" value={TIME_SLOT_LABELS[booking.time_slot] ?? booking.time_slot} icon={<Clock size={14} />} />
                            <div className="col-span-2">
                                <LabelValue label="Venue / Delivery Address" value={booking.venue_address} icon={<MapPin size={14} />} />
                            </div>
                        </div>
                    </div>

                    {/* Contact & Headcount */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Phone size={14} /> Contact</h2>
                            <div className="space-y-4">
                                <LabelValue label="Name" value={booking.contact_name} icon={<Phone size={14} />} />
                                <LabelValue label="Email" value={booking.contact_email} icon={<Mail size={14} />} />
                                <LabelValue label="Phone" value={booking.contact_phone} icon={<Phone size={14} />} />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Users size={14} /> Headcount</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-tea-600 text-sm">Total Guests</span>
                                    <span className="font-bold text-tea-900">{booking.headcount_total}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-tea-500">
                                    <span>Adults</span><span>{booking.headcount_adults}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-tea-500">
                                    <span>Children</span><span>{booking.headcount_kids}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Menu */}
                    {items.length > 0 && (
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Coffee size={14} /> Selected Menu</h2>
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-tea-50 last:border-0">
                                        <div>
                                            <p className="text-tea-800 font-medium text-sm">{item.product_name}</p>
                                            <p className="text-tea-400 text-xs">×{item.quantity} @ {formatPrice(item.unit_price)} each</p>
                                        </div>
                                        <p className="text-tea-900 font-bold text-sm">{formatPrice(item.unit_price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quote */}
                    <div className="bg-tea-900 text-white rounded-2xl p-6 shadow-xl">
                        <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-5 flex items-center gap-2"><Star size={14} /> Estimated Quote</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-tea-300"><span>Product Subtotal</span><span>{formatPrice(booking.estimated_base)}</span></div>
                            <div className="flex justify-between text-sm text-tea-300"><span>Security Deposit</span><span>{formatPrice(booking.estimated_deposit)}</span></div>
                            <div className="flex justify-between text-sm text-tea-300"><span>Delivery & Service</span><span>{formatPrice(booking.estimated_delivery)}</span></div>
                            <div className="flex justify-between text-xs text-tea-400"><span>GST (5%)</span><span>{formatPrice(booking.estimated_tax)}</span></div>
                            <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                                <span>Estimated Total</span>
                                <span className="text-accent-400">{formatPrice(booking.estimated_total)}</span>
                            </div>
                        </div>
                        <p className="text-tea-400 text-xs text-center mt-4">* Final invoice shared after confirmation call.</p>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-3">Special Requirements</h2>
                            <p className="text-tea-600 text-sm leading-relaxed">{booking.notes}</p>
                        </div>
                    )}

                    {/* Admin notes */}
                    {booking.admin_notes && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
                            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-3">Note from Our Team</h2>
                            <p className="text-emerald-700 text-sm leading-relaxed">{booking.admin_notes}</p>
                        </div>
                    )}

                    {/* Status History */}
                    {booking.status_history && booking.status_history.length > 0 && (
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Package size={14} /> Status Timeline</h2>
                            <div className="relative pl-6">
                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-tea-100" />
                                <div className="space-y-5">
                                    <div className="relative">
                                        <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-tea-300 border-2 border-white" />
                                        <p className="text-tea-800 text-sm font-medium">Booking Submitted</p>
                                        <p className="text-tea-400 text-xs mt-0.5">{formattedBookedOn}</p>
                                    </div>
                                    {booking.status_history.map((entry: any, idx: number) => {
                                        const dotColor = entry.new_status === 'confirmed' ? 'bg-emerald-500' : entry.new_status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400';
                                        const ts = entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                                        return (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full ${dotColor} border-2 border-white`} />
                                                <p className="text-tea-800 text-sm font-medium">
                                                    {entry.new_status === 'confirmed' ? '✅ Confirmed' : entry.new_status === 'cancelled' ? '❌ Cancelled' : entry.new_status}
                                                </p>
                                                {entry.notes && <p className="text-tea-500 text-xs mt-0.5 italic">{entry.notes}</p>}
                                                {ts && <p className="text-tea-400 text-xs mt-0.5">{ts}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <Link to="/event-bookings" className="flex-1 py-3 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all text-center text-sm">
                            ← My Bookings
                        </Link>
                        {booking.status === 'pending' && (
                            <button onClick={() => setEditOpen(true)} className="flex-1 py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all text-center text-sm flex items-center justify-center gap-2">
                                <Edit2 size={15} /> Edit Booking
                            </button>
                        )}
                        {booking.status === 'cancelled' && (
                            <Link to="/events" className="flex-1 py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all text-center text-sm">
                                Book Again
                            </Link>
                        )}
                    </div>

                </motion.div>
            </div>

            {/* Edit Panel */}
            <AnimatePresence>
                {editOpen && (
                    <EditPanel
                        booking={booking}
                        onClose={() => setEditOpen(false)}
                        onSaved={() => { setEditOpen(false); refetch(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventBookingDetailPage;
