'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sidebar Drawer & Tab State
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio', 'bookings', 'packages'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);

  // Form Upload State
  const [uploading, setUploading] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [file, setFile] = useState(null);

  // Form Edit State
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Check Active Admin Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAdminData();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAdminData();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAdminData() {
    // 1. Fetch Categories
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    setCategories(catData || []);

    // 2. Fetch Photos
    const { data: photoData } = await supabase.from('photos').select('*, categories(name)').order('created_at', { ascending: false });
    setPhotos(photoData || []);

    // 3. Fetch Bookings
    const { data: bookingData } = await supabase.from('bookings').select('*, packages(name)').order('created_at', { ascending: false });
    setBookings(bookingData || []);

    // 4. Fetch Packages
    const { data: pkgData } = await supabase.from('packages').select('*').order('created_at');
    setPackages(pkgData || []);
  }

  // Handle Admin Login
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Invalid email or password credentials.');
    }
  }

  // Handle Admin Logout
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Upload Photo to Supabase Storage & Database
  async function handleUploadPhoto(e) {
    e.preventDefault();
    if (!file || !photoTitle || !selectedCategoryId) {
      alert('Please select an image file, enter a title, and choose a category.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('photos').insert([
        {
          title: photoTitle,
          category_id: selectedCategoryId,
          image_url: urlData.publicUrl,
        },
      ]);

      if (dbError) {
        throw new Error(`Database Error: ${dbError.message}`);
      }

      alert('Photo successfully published to portfolio!');
      setPhotoTitle('');
      setSelectedCategoryId('');
      setFile(null);
      fetchAdminData();
    } catch (err) {
      console.error('Upload Error Details:', err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  // Open Edit Modal
  function handleStartEdit(photo) {
    setEditingPhoto(photo);
    setEditTitle(photo.title);
    setEditCategoryId(photo.category_id || '');
    setEditFile(null);
  }

  // Save Edited Photo
  async function handleSaveEditPhoto(e) {
    e.preventDefault();
    if (!editingPhoto) return;

    setUpdating(true);

    try {
      let imageUrl = editingPhoto.image_url;

      if (editFile) {
        const fileExt = editFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(filePath, editFile);

        if (uploadError) {
          throw new Error(`Storage Error: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('photos')
        .update({
          title: editTitle,
          category_id: editCategoryId,
          image_url: imageUrl,
        })
        .eq('id', editingPhoto.id);

      if (dbError) {
        throw new Error(`Database Error: ${dbError.message}`);
      }

      alert('Photo details successfully updated!');
      setEditingPhoto(null);
      fetchAdminData();
    } catch (err) {
      console.error('Update Error Details:', err);
      alert(`Failed to update photo: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  }

  // Delete Photo
  async function handleDeletePhoto(id) {
    if (!confirm('Are you sure you want to remove this photo from the public gallery?')) return;

    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) {
      alert('Failed to delete photo.');
    } else {
      fetchAdminData();
    }
  }

  // Update Booking Status
  async function handleUpdateBookingStatus(bookingId, newStatus) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      alert(`Booking status successfully updated to "${newStatus}"!`);
      fetchAdminData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Failed to update booking status: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-zinc-400 text-xs tracking-[0.25em] uppercase font-sans">
        Loading System Panel...
      </div>
    );
  }

  // VIEW 1: CLEAN WHITE ADMIN LOGIN FORM
  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-zinc-900 font-sans border-t-4 border-amber-800">
        <div className="max-w-md w-full bg-white border border-zinc-200 p-8 shadow-sm rounded-xs">
          <div className="text-center mb-8">
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-amber-800 block">
              YRLOOKS STUDIO
            </span>
            <h1 className="text-2xl font-light tracking-[0.2em] text-zinc-900 uppercase mt-1">
              ADMIN LOGIN
            </h1>
            <p className="text-zinc-500 text-xs mt-2 font-light">
              Enter authorized credentials to manage portfolio and inquiries.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yrlooks.com"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-zinc-900 hover:bg-amber-800 text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-sm"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const dpPaidCount = bookings.filter(b => b.status === 'DP Paid').length;

  // VIEW 2: HIGH-END PROFESSIONAL DASHBOARD
  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 flex flex-col font-sans selection:bg-amber-100 relative">
      
      {/* TOP HEADER BAR */}
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 bg-zinc-900 hover:bg-amber-800 text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-xs"
          >
            <span className="inline-block w-2.5 h-[2px] bg-white"></span>
            MENU
          </button>
          
          <div className="hidden sm:block h-4 w-[1px] bg-zinc-300"></div>

          <div className="hidden sm:block">
            <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-400 block">
              Active Module
            </span>
            <span className="text-xs font-semibold tracking-wider text-amber-800 uppercase">
              {activeTab === 'portfolio' && 'Portfolio Gallery Management'}
              {activeTab === 'bookings' && `Reservation & Inquiry Logs (${bookings.length})`}
              {activeTab === 'packages' && 'Service Packages Catalog'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-amber-800 block text-right">
            YRLOOKS STUDIO
          </span>
          <h1 className="text-sm font-light tracking-widest text-zinc-900 uppercase">
            ADMIN <span className="font-semibold text-amber-800">PANEL</span>
          </h1>
        </div>
      </header>

      {/* BACKDROP OVERLAY WHEN SIDEBAR IS OPEN */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      {/* SLIDE-OUT SIDEBAR DRAWER */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 bg-zinc-50 border-r border-zinc-200 p-8 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex justify-between items-start pb-6 mb-8 border-b border-zinc-200">
            <div>
              <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-amber-800 block">
                MANAGEMENT SYSTEM
              </span>
              <h2 className="text-lg font-light tracking-widest text-zinc-900 uppercase mt-0.5">
                YRLOOKS <span className="font-semibold text-amber-800">ADMIN</span>
              </h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-900 text-xs uppercase tracking-wider font-semibold transition-all"
            >
              [Close]
            </button>
          </div>

          <nav className="space-y-3">
            <button
              onClick={() => { setActiveTab('portfolio'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3.5 text-xs uppercase tracking-[0.18em] font-semibold transition-all border-l-2 ${
                activeTab === 'portfolio'
                  ? 'bg-white border-amber-800 text-amber-800 shadow-xs'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
              }`}
            >
              Portfolio Management
            </button>

            <button
              onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3.5 text-xs uppercase tracking-[0.18em] font-semibold transition-all border-l-2 flex justify-between items-center ${
                activeTab === 'bookings'
                  ? 'bg-white border-amber-800 text-amber-800 shadow-xs'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
              }`}
            >
              <span>Bookings & Requests</span>
              <span className="text-[10px] bg-zinc-200 px-2 py-0.5 text-zinc-700 font-mono font-normal">
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('packages'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3.5 text-xs uppercase tracking-[0.18em] font-semibold transition-all border-l-2 ${
                activeTab === 'packages'
                  ? 'bg-white border-amber-800 text-amber-800 shadow-xs'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
              }`}
            >
              Service Packages
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-200">
          <div className="text-[11px] text-zinc-400 mb-4 truncate">
            Active Administrator: <br />
            <strong className="text-zinc-700 font-medium">{session.user.email}</strong>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-zinc-200 hover:bg-red-800 hover:text-white text-zinc-800 text-xs uppercase tracking-widest font-semibold transition-all shadow-xs"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-10">
        
        {/* TOP SYSTEM SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 p-6 shadow-2xs border-t-2 border-t-amber-800">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 block mb-1">
              Exhibition Items
            </span>
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-light tracking-wider text-zinc-900">{photos.length} Photos</h3>
              <span className="text-[11px] text-amber-800 font-medium uppercase tracking-wider">Live Gallery</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 shadow-2xs border-t-2 border-t-zinc-800">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 block mb-1">
              Pending Action
            </span>
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-light tracking-wider text-zinc-900">{pendingCount} Requests</h3>
              <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">{dpPaidCount} DP Paid</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 shadow-2xs border-t-2 border-t-amber-800">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 block mb-1">
              Service Catalog
            </span>
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-light tracking-wider text-zinc-900">{packages.length} Packages</h3>
              <span className="text-[11px] text-amber-800 font-medium uppercase tracking-wider">{categories.length} Categories</span>
            </div>
          </div>
        </div>

        {/* TAB 1: PORTFOLIO MANAGEMENT */}
        {activeTab === 'portfolio' && (
          <div className="space-y-10">
            <div>
              <p className="text-amber-800 text-xs tracking-[0.25em] uppercase font-semibold mb-1">
                Gallery Control
              </p>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-zinc-900 uppercase">
                Portfolio Photo Management
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-light">
                Upload new photography works, update photo information, or remove items from the public exhibition.
              </p>
              <div className="w-12 h-[1px] bg-amber-700/40 mt-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form Upload Photo */}
              <form onSubmit={handleUploadPhoto} className="lg:col-span-2 bg-white border border-zinc-200 p-6 md:p-8 space-y-6 shadow-2xs">
                <h3 className="text-xs uppercase tracking-[0.2em] text-amber-800 font-bold pb-2 border-b border-zinc-100">
                  Upload New Portfolio Image
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-700 font-semibold mb-2">
                      Photo Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Intimate Garden Wedding"
                      value={photoTitle}
                      onChange={(e) => setPhotoTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-amber-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-700 font-semibold mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-amber-800"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-700 font-semibold mb-2">
                    Image File (JPG, PNG, WebP) *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 file:mr-4 file:py-1.5 file:px-3 file:border-0 file:bg-zinc-800 file:text-white file:text-xs hover:file:bg-amber-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full md:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-amber-800 text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 disabled:opacity-50 shadow-sm"
                >
                  {uploading ? 'Publishing Photo...' : 'Publish to Portfolio'}
                </button>
              </form>

              {/* STATISTIK & PANDUAN RINGKAS */}
              <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-4 shadow-2xs">
                <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-800 font-bold pb-2 border-b border-zinc-100">
                  Exhibition Guidelines
                </h3>
                <ul className="space-y-3 text-xs text-zinc-600 font-light leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-800 font-bold">•</span>
                    <span>High resolution photos (JPG/WebP) under 5MB are recommended.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-800 font-bold">•</span>
                    <span>Use the "Edit" feature on gallery items to update title, category, or replace image file.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-800 font-bold">•</span>
                    <span>Deleting an item removes it permanently from public exhibition.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Photo Collection Grid dengan Tombol EDIT & DELETE */}
            <div className="pt-6 border-t border-zinc-200">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-700 font-bold mb-6">
                Active Gallery Collection ({photos.length})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white border border-zinc-200 p-3 shadow-2xs group flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/5] bg-zinc-100 overflow-hidden flex items-center justify-center mb-3 border border-zinc-100">
                        <img src={photo.image_url} alt={photo.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-zinc-800 truncate">{photo.title}</h4>
                        <span className="text-[10px] text-amber-800 uppercase tracking-wider block font-medium">
                          {photo.categories?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                      <button
                        onClick={() => handleStartEdit(photo)}
                        className="text-[10px] bg-amber-800 hover:bg-amber-900 text-white py-1.5 transition-all uppercase tracking-wider text-center font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="text-[10px] bg-stone-100 hover:bg-red-700 hover:text-white text-zinc-600 border border-zinc-200 py-1.5 transition-all uppercase tracking-wider text-center"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS LIST */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <p className="text-amber-800 text-xs tracking-[0.25em] uppercase font-semibold mb-1">
                Client Interactions
              </p>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-zinc-900 uppercase">
                Reservation & Inquiry Logs
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-light">
                Review submitted client details and update booking reservation statuses.
              </p>
              <div className="w-12 h-[1px] bg-amber-700/40 mt-4" />
            </div>

            <div className="bg-white border border-zinc-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-zinc-50 text-zinc-700 uppercase tracking-wider border-b border-zinc-200 font-semibold">
                  <tr>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">WhatsApp / Phone</th>
                    <th className="p-4">Event Date</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-zinc-50/60">
                      <td className="p-4 text-zinc-400">
                        {new Date(booking.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-4 font-semibold text-zinc-900">{booking.client_name}</td>
                      <td className="p-4 text-amber-800 font-mono font-medium">{booking.client_phone}</td>
                      <td className="p-4 font-medium">{booking.event_date}</td>
                      <td className="p-4">{booking.packages?.name || '-'}</td>
                      <td className="p-4 text-zinc-500 max-w-xs truncate">{booking.notes || '-'}</td>
                      <td className="p-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-800 px-2 py-1.5 focus:outline-none focus:border-amber-800 font-medium"
                        >
                          <option value="Pending">Pending</option>
                          <option value="DP Paid">DP Paid</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICE PACKAGES */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div>
              <p className="text-amber-800 text-xs tracking-[0.25em] uppercase font-semibold mb-1">
                Offerings
              </p>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-zinc-900 uppercase">
                Service Packages Catalog
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-light">
                Active packages currently featured on the public page.
              </p>
              <div className="w-12 h-[1px] bg-amber-700/40 mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-white border border-zinc-200 p-6 space-y-3 shadow-2xs">
                  <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-widest">
                    {pkg.category}
                  </span>
                  <h3 className="text-base font-semibold text-zinc-900">{pkg.name}</h3>
                  <div className="w-full h-[1px] bg-zinc-100" />
                  <ul className="space-y-2 text-xs text-zinc-600">
                    {pkg.features?.map((f, i) => (
                      <li key={i}>✓ {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL POPUP EDIT PHOTO */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <h3 className="text-xs uppercase tracking-[0.2em] text-amber-800 font-bold">
                Edit Portfolio Photo
              </h3>
              <button
                onClick={() => setEditingPhoto(null)}
                className="text-zinc-400 hover:text-zinc-900 text-xs uppercase font-semibold"
              >
                [Close]
              </button>
            </div>

            <form onSubmit={handleSaveEditPhoto} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-700 font-semibold mb-2">
                  Photo Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-700 font-semibold mb-2">
                  Category *
                </label>
                <select
                  required
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-amber-800"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-700 font-semibold mb-2">
                  Replace Image File (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 file:mr-4 file:py-1.5 file:px-3 file:border-0 file:bg-zinc-800 file:text-white file:text-xs hover:file:bg-amber-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs uppercase tracking-wider font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-amber-800 text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}