import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar, Users, MapPin, Clock, CheckCircle,
    XCircle, ChevronRight, Sparkles, Package,
} from 'lucide-react';
import { useGetMyEventBookingsQuery, EventBookingSummary } from '../features/events/eventsApi';
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

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-amber-50 text-amber-700 border border-amber-200',
        confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        cancelled: 'bg-red-50 text-red-600 border border-red-200',
    };
    const icons: Record<string, React.ReactNode> = {
        pending: <Clock size={12} />,
        confirmed: <CheckCircle size={12} />,
        cancelled: <XCircle size={12} />,
    };
    const label: Record<string, string> = {
        pending: 'Pending Confirmation',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {icons[status]}
            {label[status] ?? status}
        </span>
    );
}

const EventBookingsPage: React.FC = () => {
    const { isAuthenticated } = useAppSelector((s) => s.auth);
    const dispatch = useAppDispatch();
    const { data, isLoading } = useGetMyEventBookingsQuery(undefined, { skip: !isAuthenticated });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border border-gray-100">
                    <Sparkles size={40} className="text-accent-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Sign In Required</h2>
                    <p className="text-gray-500 mb-8 font-light">Sign in to view your event booking history and track status updates.</p>
                    <button
                        onClick={() => dispatch(setAuthModalOpen(true))}
                        className="px-10 py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-lg hover:bg-tea-950 transition-all uppercase tracking-widest text-xs"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <TeaLoader type="kettle" size="fullscreen" message="Loading your event bookings..." />;
    }

    const bookings: EventBookingSummary[] = data?.data ?? [];
    const active = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
    const past = bookings.filter(b => b.status === 'cancelled');

    return (
        <div className="min-h-screen bg-cream py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-tea-900">My Event Bookings</h1>
                        <p className="text-tea-500 mt-1 text-sm">Track and manage your catering enquiries.</p>
                    </div>
                    <Link
                        to="/events"
                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-tea-700 text-white text-sm font-bold rounded-xl hover:bg-tea-800 transition-colors"
                    >
                        <Sparkles size={14} /> New Booking
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] shadow-lg border border-tea-100 p-16 text-center">
                        <div className="w-20 h-20 bg-tea-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={36} className="text-tea-300" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-tea-900 mb-3">No Bookings Yet</h3>
                        <p className="text-tea-500 mb-8 max-w-sm mx-auto">Planning an event? Let us bring premium tea catering to your celebration.</p>
                        <Link to="/events" className="px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors inline-flex items-center gap-2">
                            <Sparkles size={16} /> Book an Event
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Active bookings */}
                        {active.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-tea-500 mb-4">Active Bookings</h2>
                                <div className="space-y-4">
                                    {active.map((booking) => (
                                        <div key={booking.id}><BookingCard booking={booking} /></div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Past bookings */}
                        {past.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-tea-500 mb-4">Past Bookings</h2>
                                <div className="space-y-4 opacity-75">
                                    {past.map((booking) => (
                                        <div key={booking.id}><BookingCard booking={booking} /></div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

function BookingCard({ booking }: { booking: EventBookingSummary }) {
    const itemCount = Array.isArray(booking.selected_items) ? booking.selected_items.length : 0;
    const formattedDate = booking.event_date
        ? new Date(booking.event_date + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
        : '—';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <Link to={`/event-booking/${booking.id}`} className="block group">
                <div className="bg-white rounded-2xl border border-tea-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                    {/* Header */}
                    <div className={`px-6 py-4 flex items-center justify-between ${booking.status === 'confirmed' ? 'bg-emerald-700' : booking.status === 'cancelled' ? 'bg-red-700' : 'bg-tea-700'}`}>
                        <div>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                                {EVENT_TYPE_LABELS[booking.event_type] ?? booking.event_type}
                            </p>
                            <h3 className="text-white font-bold text-lg leading-tight">{booking.event_name}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={booking.status} />
                            <ChevronRight size={18} className="text-white/60 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-start gap-2">
                                <Calendar size={14} className="text-tea-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-tea-400 font-bold uppercase tracking-wider">Date</p>
                                    <p className="text-tea-800 font-medium text-xs leading-tight">{formattedDate}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock size={14} className="text-tea-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-tea-400 font-bold uppercase tracking-wider">Time</p>
                                    <p className="text-tea-800 font-medium text-xs">{TIME_SLOT_LABELS[booking.time_slot] ?? booking.time_slot}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Users size={14} className="text-tea-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-tea-400 font-bold uppercase tracking-wider">Guests</p>
                                    <p className="text-tea-800 font-medium text-xs">{booking.headcount_total} people</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Package size={14} className="text-tea-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-tea-400 font-bold uppercase tracking-wider">Items</p>
                                    <p className="text-tea-800 font-medium text-xs">{itemCount} type{itemCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-tea-50">
                            <div className="flex items-start gap-2">
                                <MapPin size={12} className="text-tea-400 mt-0.5 flex-shrink-0" />
                                <p className="text-tea-500 text-xs line-clamp-1">{booking.venue_address}</p>
                            </div>
                            <p className="text-tea-900 font-bold text-sm flex-shrink-0 ml-4">{formatPrice(booking.estimated_total)}</p>
                        </div>

                        {booking.status === 'cancelled' && booking.cancellation_reason && (
                            <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-100">
                                <p className="text-red-600 text-xs"><span className="font-bold">Reason:</span> {booking.cancellation_reason}</p>
                            </div>
                        )}

                        {booking.status === 'pending' && (
                            <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <p className="text-amber-700 text-xs font-medium">⏰ Awaiting confirmation — our team will call you soon.</p>
                            </div>
                        )}

                        {booking.status === 'confirmed' && (
                            <div className="mt-3 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                <p className="text-emerald-700 text-xs font-medium">✅ Booking confirmed! Products are reserved for your event.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default EventBookingsPage;
