import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, Star, Users, Clock } from 'lucide-react';
import eventTeaParty from '../../assets/event-tea-party.png';
import './EventBanner.css';

interface EventBannerProps {
    className?: string;
}

const EventBanner: React.FC<EventBannerProps> = ({ className = '' }) => {
    const bannerRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (bannerRef.current) {
            observer.observe(bannerRef.current);
        }

        return () => {
            if (bannerRef.current) {
                observer.unobserve(bannerRef.current);
            }
        };
    }, []);

    return (
        <section
            ref={bannerRef}
            className={`event-banner ${isVisible ? 'event-banner--visible' : ''} ${className}`}
            role="banner"
            aria-label="Event catering promotion"
        >
            {/* Background Image with Gradient Overlay */}
            <div className="event-banner__background">
                <picture>
                    <source
                        srcSet={eventTeaParty}
                        type="image/png"
                    />
                    <img
                        src={eventTeaParty}
                        alt="Elegant tea party event setup with fine china and pastries"
                        className="event-banner__bg-image"
                        loading="lazy"
                        decoding="async"
                    />
                </picture>
                <div className="event-banner__gradient-overlay" aria-hidden="true" />
            </div>

            {/* Floating Decorative Elements */}
            <div className="event-banner__decorations" aria-hidden="true">
                <img
                    src="/images/floating-teacup.svg"
                    alt=""
                    className="event-banner__float event-banner__float--teacup-1"
                />
                <img
                    src="/images/floating-leaf.svg"
                    alt=""
                    className="event-banner__float event-banner__float--leaf-1"
                />
                <img
                    src="/images/floating-teacup.svg"
                    alt=""
                    className="event-banner__float event-banner__float--teacup-2"
                />
                <img
                    src="/images/floating-leaf.svg"
                    alt=""
                    className="event-banner__float event-banner__float--leaf-2"
                />
            </div>

            {/* Main Content Container */}
            <div className="event-banner__container">
                <div className="event-banner__content">
                    {/* Text Section */}
                    <div className="event-banner__text">
                        <h2 className="event-banner__headline">
                            Perfect Tea for Your
                            <br />
                            <span className="event-banner__headline-accent">Special Events</span>
                        </h2>

                        <p className="event-banner__subheadline">
                            Custom tea catering for weddings, corporate events & celebrations.
                            <br className="hidden md:block" />
                            Elevate your gatherings with our premium tea service.
                        </p>

                        {/* CTA Buttons */}
                        <div className="event-banner__cta-group">
                            <Link
                                to="/events"
                                className="event-banner__cta event-banner__cta--primary"
                            >
                                <Calendar className="event-banner__cta-icon" aria-hidden="true" />
                                Plan Your Event
                            </Link>
                            <Link
                                to="/events"
                                className="event-banner__cta event-banner__cta--secondary"
                            >
                                <Phone className="event-banner__cta-icon" aria-hidden="true" />
                                Get Custom Quote
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="event-banner__trust-indicators">
                            <div className="event-banner__trust-item">
                                <Users className="event-banner__trust-icon" aria-hidden="true" />
                                <span className="event-banner__trust-text">500+ Events Served</span>
                            </div>
                            <div className="event-banner__trust-item">
                                <Star className="event-banner__trust-icon" aria-hidden="true" />
                                <span className="event-banner__trust-text">
                                    4.9/5 ★★★★★ Rating
                                </span>
                            </div>
                            <div className="event-banner__trust-item">
                                <Clock className="event-banner__trust-icon" aria-hidden="true" />
                                <span className="event-banner__trust-text">Free Consultation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EventBanner;
