import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Users, MapPin, Clock, Package,
    CheckCircle, XCircle, AlertCircle, Phone, Mail,
    Coffee, Star,
} from 'lucide-react';
import { useGetEventBookingByIdQuery } from '../features/events/eventsApi';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthModalOpen } from '../features/auth/authSlice';
import { TeaLoader } from '../components/common/TeaLoader';
import { formatPrice } from '../utils/format';

const TIME_SLOT_LABELS: Record<string, string> = {
    morning: '☀️ Morning (7am–12pm)',
    afternoon: '🌤 Afternoon (12pm–5pm)',
    evening: '🌙 Evening (5pm–10pm)',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    wedding: 'Wedding',
    corporate: 'Corporate Event',
    birthday: 'Birthday Party',
    anniversary: 'Anniversary',
    conference: 'Conference / Seminar',
    other: 'Other Celebration',
};

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string }> = {
    pending: {
        label: 'Pending Confirmation',
        color: 'text-amber-700',
        bgColor: 'bg-amber-700',
        icon: <Clock size={20} />,
        description: 'Your booking request has been received. Our team will call you within 30–60 minutes to confirm.',
    },
    confirmed: {
        label: 'Confirmed',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-700',
        icon: <CheckCircle size={20} />,
        description: 'Your event is confirmed! Products are reserved and our team will handle the setup.',
    },
    cancelled: {
        label: 'Cancelled',
        color: 'text-red-600',
        bgColor: 'bg-red-700',
        icon: <XCircle size={20} />,
        description: 'This booking has been cancelled.',
    },
};

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

const EventBookingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useAppSelector((s) => s.auth);
    const dispatch = useAppDispatch();

    const { data: booking, isLoading, error } = useGetEventBookingByIdQuery(id ?? '', {
        skip: !id || !isAuthenticated,
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border border-gray-100">
                    <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Authentication Required</h2>
                    <button
                        onClick={() => dispatch(setAuthModalOpen(true))}
                        className="px-10 py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-lg hover:bg-tea-950 transition-all"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <TeaLoader type="kettle" size="fullscreen" message="Loading booking details..." />;
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Booking Not Found</h2>
                    <p className="text-gray-500 mb-8">This event booking doesn't exist or you don't have access to it.</p>
                    <Link to="/event-bookings" className="inline-block px-10 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all">
                        My Bookings
                    </Link>
                </div>
            </div>
        );
    }

    const status = booking.status as BookingStatus;
    const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const items = Array.isArray(booking.selected_items) ? booking.selected_items : [];

    const formattedDate = booking.event_date
        ? new Date(booking.event_date + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
        : '—';

    const formattedBookedOn = booking.created_at
        ? new Date(booking.created_at).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })
        : '—';

    return (
        <div className="min-h-screen bg-cream py-10 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back */}
                <Link to="/event-bookings" className="inline-flex items-center gap-2 text-tea-500 hover:text-tea-800 transition-colors text-sm font-bold uppercase tracking-widest mb-8">
                    <ArrowLeft size={16} /> My Bookings
                </Link>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Status Card */}
                    <div className={`${statusConfig.bgColor} rounded-3xl p-6 text-white shadow-xl`}>
                        <div className="flex items-center gap-3 mb-3">
                            {statusConfig.icon}
                            <div>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                                    {EVENT_TYPE_LABELS[booking.event_type] ?? booking.event_type}
                                </p>
                                <h1 className="text-2xl font-serif font-bold">{booking.event_name}</h1>
                            </div>
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
                        <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Calendar size={14} /> Event Details
                        </h2>
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
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Phone size={14} /> Contact
                            </h2>
                            <div className="space-y-4">
                                <LabelValue label="Name" value={booking.contact_name} icon={<Phone size={14} />} />
                                <LabelValue label="Email" value={booking.contact_email} icon={<Mail size={14} />} />
                                <LabelValue label="Phone" value={booking.contact_phone} icon={<Phone size={14} />} />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Users size={14} /> Headcount
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-tea-600 text-sm">Total Guests</span>
                                    <span className="font-bold text-tea-900">{booking.headcount_total}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-tea-500">
                                    <span>Adults</span>
                                    <span>{booking.headcount_adults}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-tea-500">
                                    <span>Children</span>
                                    <span>{booking.headcount_kids}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-tea-500">
                                    <span>Senior Citizens</span>
                                    <span>{booking.headcount_seniors}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Menu */}
                    {items.length > 0 && (
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Coffee size={14} /> Selected Menu
                            </h2>
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

                    {/* Quote Breakdown */}
                    <div className="bg-tea-900 text-white rounded-2xl p-6 shadow-xl">
                        <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Star size={14} /> Estimated Quote
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-tea-300">
                                <span>Product Subtotal</span>
                                <span>{formatPrice(booking.estimated_base)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-tea-300">
                                <span>Security Deposit (flasks)</span>
                                <span>{formatPrice(booking.estimated_deposit)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-tea-300">
                                <span>Delivery & Service</span>
                                <span>{formatPrice(booking.estimated_delivery)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-tea-400">
                                <span>GST (5%)</span>
                                <span>{formatPrice(booking.estimated_tax)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                                <span>Estimated Total</span>
                                <span className="text-accent-400">{formatPrice(booking.estimated_total)}</span>
                            </div>
                        </div>
                        <p className="text-tea-400 text-xs text-center mt-4">
                            * Final invoice shared after confirmation call.
                        </p>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-3">Special Requirements</h2>
                            <p className="text-tea-600 text-sm leading-relaxed">{booking.notes}</p>
                        </div>
                    )}

                    {/* Admin notes (visible to customer if set) */}
                    {booking.admin_notes && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
                            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-3">Note from Our Team</h2>
                            <p className="text-emerald-700 text-sm leading-relaxed">{booking.admin_notes}</p>
                        </div>
                    )}

                    {/* Status History */}
                    {booking.status_history && booking.status_history.length > 0 && (
                        <div className="bg-white rounded-2xl border border-tea-100 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-tea-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Package size={14} /> Status Timeline
                            </h2>
                            <div className="relative pl-6">
                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-tea-100" />
                                <div className="space-y-5">
                                    {/* Initial submission */}
                                    <div className="relative">
                                        <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-tea-300 border-2 border-white" />
                                        <p className="text-tea-800 text-sm font-medium">Booking Submitted</p>
                                        <p className="text-tea-400 text-xs mt-0.5">{formattedBookedOn}</p>
                                    </div>
                                    {booking.status_history.map((entry, idx) => {
                                        const dotColor =
                                            entry.new_status === 'confirmed' ? 'bg-emerald-500' :
                                            entry.new_status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400';
                                        const ts = entry.created_at
                                            ? new Date(entry.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })
                                            : '';
                                        return (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full ${dotColor} border-2 border-white`} />
                                                <p className="text-tea-800 text-sm font-medium capitalize">
                                                    {entry.new_status === 'confirmed' ? '✅ Confirmed' :
                                                     entry.new_status === 'cancelled' ? '❌ Cancelled' :
                                                     entry.new_status}
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

                    {/* Bottom actions */}
                    <div className="flex gap-4 pt-2">
                        <Link to="/event-bookings" className="flex-1 py-3 border border-tea-200 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all text-center text-sm">
                            ← My Bookings
                        </Link>
                        {booking.status === 'cancelled' && (
                            <Link to="/events" className="flex-1 py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all text-center text-sm">
                                Book Again
                            </Link>
                        )}
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

export default EventBookingDetailPage;
