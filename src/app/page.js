'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  // Active Menu State
  const [activeSection, setActiveSection] = useState('');

  // Limit Tampilan Foto Awal diatur 6 (3 di atas, 3 di bawah pada desktop)
  const [visibleCount, setVisibleCount] = useState(6);

  // Mobile Navigation State
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Form Booking State
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Scroll Spy untuk mendeteksi section aktif secara akurat
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['portfolio', 'services', 'booking'];
      const scrollPosition = window.scrollY + 250;

      if (window.scrollY < 100) {
        setActiveSection('');
        return;
      }

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset jumlah foto yang tampil kembali ke 6 saat kategori diubah
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory]);

  async function fetchInitialData() {
    setLoading(true);

    // 1. Fetch Categories
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    const allowedCategoryNames = ['Wedding', 'Pra-Wedding', 'Studio'];
    const filteredCategories = (catData || []).filter((cat) =>
      allowedCategoryNames.includes(cat.name)
    );

    filteredCategories.sort((a, b) => {
      return allowedCategoryNames.indexOf(a.name) - allowedCategoryNames.indexOf(b.name);
    });

    setCategories(filteredCategories);

    // 2. Fetch Photos
    const { data: photoData } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    setPhotos(photoData || []);

    // 3. Fetch Packages
    const { data: pkgData } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: true });
    setPackages(pkgData || []);

    setLoading(false);
  }

  // Handle Submit Form Booking
  async function handleBookingSubmit(e) {
    e.preventDefault();
    if (!clientName || !clientPhone || !eventDate || !selectedPackageId) {
      alert('Please fill in all required fields in the reservation form.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('bookings').insert([
      {
        client_name: clientName,
        client_phone: clientPhone,
        event_date: eventDate,
        package_id: selectedPackageId,
        notes: notes,
        status: 'Pending',
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit reservation. Please try again.');
    } else {
      setBookingSuccess(true);
    }
  }

  const filteredPhotos =
    selectedCategory === 'all'
      ? photos
      : photos.filter((photo) => photo.category_id === selectedCategory);

  const displayedPhotos = filteredPhotos.slice(0, visibleCount);

  const selectedPackageDetail = packages.find((p) => p.id === selectedPackageId);

  return (
    <main className="min-h-screen bg-white text-zinc-900 selection:bg-amber-100 selection:text-amber-900 font-sans antialiased overflow-x-hidden pt-16 md:pt-20">
      
      {/* HEADER FIXED DI ATAS (GARIS EMAS + NAVBAR) */}
      <div className="fixed top-0 left-0 right-0 z-50 shadow-xs">
        <div className="h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700" />

        <nav className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md px-4 md:px-6 lg:px-12 py-3 md:py-5 transition-all">
          <div className="max-w-[1920px] mx-auto flex justify-between items-center">
            <a href="#" className="text-xs md:text-sm font-semibold tracking-[0.25em] md:tracking-[0.35em] text-zinc-900 uppercase hover:opacity-80 transition-opacity">
              YRLOOKS <span className="text-amber-700 font-light">STUDIO</span>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.25em] font-medium text-zinc-600">
              <a
                href="#portfolio"
                onClick={() => setActiveSection('portfolio')}
                className={`transition-colors relative group py-1 ${
                  activeSection === 'portfolio' ? 'text-amber-700 font-semibold' : 'hover:text-amber-700'
                }`}
              >
                Portfolio
                <span className={`absolute bottom-0 left-0 h-[1.5px] bg-amber-600 transition-all duration-300 ${
                  activeSection === 'portfolio' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </a>
              <a
                href="#services"
                onClick={() => setActiveSection('services')}
                className={`transition-colors relative group py-1 ${
                  activeSection === 'services' ? 'text-amber-700 font-semibold' : 'hover:text-amber-700'
                }`}
              >
                Services & Packages
                <span className={`absolute bottom-0 left-0 h-[1.5px] bg-amber-600 transition-all duration-300 ${
                  activeSection === 'services' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </a>
              <a
                href="#booking"
                onClick={() => setActiveSection('booking')}
                className={`transition-colors relative group py-1 ${
                  activeSection === 'booking' ? 'text-amber-700 font-semibold' : 'hover:text-amber-700'
                }`}
              >
                Inquiry & Booking
                <span className={`absolute bottom-0 left-0 h-[1.5px] bg-amber-600 transition-all duration-300 ${
                  activeSection === 'booking' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="md:hidden text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-900 px-3 py-1.5 border border-zinc-300 bg-white hover:bg-zinc-50 transition-all shadow-xs"
            >
              {isNavOpen ? 'Close' : 'Menu'}
            </button>
          </div>

          {/* Mobile Slide-Down Menu */}
          {isNavOpen && (
            <div className="md:hidden pt-3 pb-3 border-t border-zinc-100 mt-2.5 flex flex-col gap-2 text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-700 bg-white shadow-xl px-3 animate-fadeIn">
              <a
                href="#portfolio"
                onClick={() => {
                  setActiveSection('portfolio');
                  setIsNavOpen(false);
                }}
                className={`py-2.5 px-3 transition-colors ${
                  activeSection === 'portfolio' ? 'bg-amber-50 text-amber-700 font-semibold' : 'hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                Portfolio
              </a>
              <a
                href="#services"
                onClick={() => {
                  setActiveSection('services');
                  setIsNavOpen(false);
                }}
                className={`py-2.5 px-3 transition-colors ${
                  activeSection === 'services' ? 'bg-amber-50 text-amber-700 font-semibold' : 'hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                Services & Packages
              </a>
              <a
                href="#booking"
                onClick={() => {
                  setActiveSection('booking');
                  setIsNavOpen(false);
                }}
                className={`py-2.5 px-3 transition-colors ${
                  activeSection === 'booking' ? 'bg-amber-50 text-amber-700 font-semibold' : 'hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                Inquiry & Booking
              </a>
            </div>
          )}
        </nav>
      </div>

      {/* Hero Section */}
      <header className="max-w-[1920px] mx-auto text-center px-6 lg:px-12 pt-10 pb-16 flex flex-col items-center relative bg-white">
        <div className="relative group cursor-pointer my-2">
          <div className="absolute -inset-6 bg-zinc-100 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <img
            src="/logo.png"
            alt="YRLOOKS PHOTOGRAPHY"
            className="relative h-28 md:h-44 lg:h-52 w-auto object-contain mx-auto transition-all duration-700 ease-out group-hover:scale-105 filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.06)]"
          />
        </div>

        <p className="text-zinc-500 mt-6 text-[10px] md:text-xs tracking-[0.35em] uppercase font-light max-w-sm mx-auto leading-relaxed">
          Capturing Authentic Moments & Timeless Stories
        </p>

        <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-amber-600/60 to-transparent mx-auto mt-8" />
      </header>

      {/* SECTION 1: PORTFOLIO GALLERY */}
      <section id="portfolio" className="max-w-[1920px] mx-auto px-6 lg:px-12 mb-36 scroll-mt-28">
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-14">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-7 py-3.5 text-xs uppercase tracking-[0.25em] transition-all duration-300 font-medium ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 -translate-y-0.5'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/90'
            }`}
          >
            All Works ({photos.length})
          </button>

          {categories.map((category) => {
            const count = photos.filter((p) => p.category_id === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-7 py-3.5 text-xs uppercase tracking-[0.25em] transition-all duration-300 font-medium ${
                  selectedCategory === category.id
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 -translate-y-0.5'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/90'
                }`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-36">
            <p className="text-zinc-400 text-xs tracking-[0.35em] uppercase animate-pulse">
              Curating Gallery Collection...
            </p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-24 bg-amber-50/10 border border-dashed border-zinc-200 rounded-sm">
            <p className="text-zinc-400 text-xs tracking-widest uppercase">
              No photos available in this category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-[1600px] mx-auto">
              {displayedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className="group cursor-pointer bg-white border border-zinc-200/80 p-4 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-amber-400/80"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-50 relative flex items-center justify-center">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className="h-full w-full object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white text-xs uppercase tracking-[0.3em] border border-white/80 px-6 py-3 backdrop-blur-md font-medium transition-transform duration-300 group-hover:scale-105">
                        View Details
                      </span>
                    </div>
                  </div>
                  <div className="pt-6 pb-2 px-2 text-center">
                    <h3 className="font-medium text-zinc-900 text-xs md:text-sm tracking-[0.25em] group-hover:text-amber-800 transition-colors uppercase">
                      {photo.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < filteredPhotos.length && (
              <div className="mt-16 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-6 py-3 md:px-10 md:py-4.5 bg-white border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                >
                  Load More Works ({filteredPhotos.length - visibleCount} Remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* SECTION 2: SERVICES & PACKAGES */}
      <section id="services" className="bg-[#f7f6f2] border-y border-zinc-200 py-28 px-6 lg:px-12 mb-36 scroll-mt-28">
        <div className="max-w-[1920px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-base md:text-xl tracking-[0.3em] uppercase font-semibold text-amber-700 mb-3">
              SERVICES & PACKAGES
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm font-light tracking-wide leading-relaxed">
              Each session is meticulously tailored to suit your special occasion. Select a package to request an official quote.
            </p>
            <div className="w-16 h-[1.5px] bg-amber-600/50 mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white border p-10 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                  pkg.is_popular ? 'border-amber-500 shadow-lg ring-1 ring-amber-500/30' : 'border-zinc-200/90'
                }`}
              >
                {pkg.is_popular && (
                  <span className="absolute -top-3.5 right-8 bg-amber-600 text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-4 py-1.5 shadow-md">
                    RECOMMENDED
                  </span>
                )}
                <div>
                  <span className="text-xs font-semibold tracking-[0.25em] text-amber-700 uppercase block mb-2">
                    {pkg.category}
                  </span>
                  <h3 className="text-2xl font-medium tracking-wide text-zinc-900 mb-4">
                    {pkg.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-medium block mb-1">
                      Pricelist Status
                    </span>
                    <span className="text-xs font-semibold text-amber-800 tracking-wider uppercase">
                      Price Available by Request
                    </span>
                  </div>
                  <div className="w-full h-[1px] bg-zinc-100 mb-8" />
                  <ul className="space-y-4 mb-10">
                    {pkg.features?.map((feature, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-zinc-600 flex items-start gap-3">
                        <span className="text-amber-600 font-bold mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#booking"
                  onClick={() => {
                    setSelectedPackageId(pkg.id);
                    setBookingSuccess(false);
                    setActiveSection('booking');
                  }}
                  className={`w-full py-3.5 text-center text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 ${
                    pkg.is_popular
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  REQUEST QUOTE
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FORM BOOKING / INQUIRY */}
      <section id="booking" className="max-w-4xl mx-auto px-6 mb-36 scroll-mt-28">
        <div className="text-center mb-14">
          <h2 className="text-base md:text-xl tracking-[0.3em] uppercase font-semibold text-amber-700 mb-3">
            BOOKING FORM
          </h2>
          <p className="text-zinc-500 text-xs md:text-sm font-light tracking-wide leading-relaxed">
            Submit your event schedule details. The YRLOOKS PHOTOGRAPHY team will review and get back to you shortly.
          </p>
          <div className="w-14 h-[1.5px] bg-amber-600/50 mx-auto mt-6" />
        </div>

        {bookingSuccess ? (
          <div className="bg-white border border-amber-500/40 p-12 text-center rounded-xs shadow-xl animate-fadeIn">
            <span className="text-5xl mb-4 block">✨</span>
            <h3 className="text-2xl font-medium text-zinc-900 uppercase tracking-wide mb-3">
              Inquiry Submitted Successfully!
            </h3>
            <p className="text-zinc-600 text-xs md:text-sm mb-10 max-w-lg mx-auto leading-relaxed">
              Thank you, <strong className="text-zinc-900">{clientName}</strong>. Your reservation request for{' '}
              <strong className="text-zinc-900">{selectedPackageDetail?.name}</strong> on{' '}
              <strong className="text-zinc-900">{eventDate}</strong> has been received. Our team will contact you soon.
            </p>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setBookingSuccess(false);
                  setClientName('');
                  setClientPhone('');
                  setEventDate('');
                  setNotes('');
                  setSelectedPackageId('');
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs uppercase tracking-[0.25em] font-medium px-10 py-4.5 transition-all shadow-md"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="bg-white border border-zinc-200 p-6 md:p-10 space-y-7 shadow-xl">
            <div>
              <label className="block text-xs uppercase tracking-[0.25em] text-zinc-700 font-medium mb-3">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50/60 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-[0.25em] text-zinc-700 font-medium mb-3">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +6281234567890"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-zinc-50/60 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-600 transition-colors"
                />
                <span className="text-[10px] text-zinc-400 tracking-wider mt-1.5 block">
                  Format: Include country code (e.g., +62 or 08...)
                </span>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.25em] text-zinc-700 font-medium mb-3">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-5 py-4 bg-zinc-50/60 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.25em] text-zinc-700 font-medium mb-3">
                Select Service Package *
              </label>
              <select
                required
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50/60 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-600 transition-colors"
              >
                <option value="">-- Select Package --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.25em] text-zinc-700 font-medium mb-3">
                Event Location & Concept Notes
              </label>
              <textarea
                rows="4"
                placeholder="Mention event location (city/venue) or preferred photography concepts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50/60 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-600 transition-colors"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-zinc-900 hover:bg-amber-600 text-white text-xs uppercase tracking-[0.3em] font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-2xl flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>REQUEST QUOTE</span>
              )}
            </button>
          </form>
        )}
      </section>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-lg flex items-center justify-center p-4 md:p-10 animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute -top-14 right-0 text-white/80 hover:text-white text-xs uppercase tracking-[0.2em] bg-zinc-900/90 px-5 py-2 border border-zinc-700 transition-colors"
            >
              Close ✕
            </button>
            <img
              src={activePhoto.image_url}
              alt={activePhoto.title}
              className="max-h-[82vh] w-auto object-contain rounded-xs shadow-2xl"
            />
            <p className="text-white text-sm md:text-base tracking-[0.25em] uppercase font-light mt-5">
              {activePhoto.title}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-950 text-white py-6 md:py-8 px-6 lg:px-12 border-t border-zinc-800">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <img
              src="/logo.png"
              alt="YRLOOKS PHOTOGRAPHY"
              className="h-7 md:h-9 w-auto object-contain brightness-0 invert"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-8 text-xs text-zinc-400 tracking-wider">
            <div>
              <span className="text-zinc-500 block uppercase text-[9px] tracking-[0.25em] mb-0.5">Email</span>
              <a
                href="mailto:yrlooksphotography@gmail.com"
                className="text-zinc-200 hover:text-amber-400 transition-colors underline underline-offset-4"
              >
                yrlooksphotography@gmail.com
              </a>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase text-[9px] tracking-[0.25em] mb-0.5">Instagram</span>
              <a
                href="https://instagram.com/yrlooks.photography"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-200 hover:text-amber-400 transition-colors underline underline-offset-4"
              >
                @yrlooks.photography
              </a>
            </div>
          </div>

          <div className="text-zinc-500 text-[11px] tracking-widest">
            © {new Date().getFullYear()} YRLOOKS PHOTOGRAPHY. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  );
}