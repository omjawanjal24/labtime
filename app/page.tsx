'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all feature cards, team cards, and sections
    const elementsToObserve = document.querySelectorAll(
      '[data-animate-fade-in-up], [data-animate-fade-in-down], [data-animate-fade-in-left], [data-animate-fade-in-right], [data-animate-slide-in]'
    );

    elementsToObserve.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowDropdown(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-black/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/mit-logo.png" alt="MIT-WPU LabTime" className="h-10 w-auto" />
            </Link>

            <div className="hidden md:flex items-center space-x-8 text-sm">
              <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Equipment</a>
              <a href="#about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</a>
              <a href="#guidelines" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Guidelines</a>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-600 dark:text-gray-400"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-600 dark:text-gray-400">
                🔔
              </button>
              {!loading && (
                user ? (
                  <div className="relative" data-dropdown>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                      👤
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/dashboard/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors border-t border-gray-200 dark:border-gray-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
                  >
                    👤
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-20 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100/40 dark:from-gray-900/40 to-white/80 dark:to-black/80"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-200/10 dark:from-cyan-900/10 via-transparent to-transparent"></div>
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-cyan-400/5 dark:bg-cyan-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl">
          {/* Badge */}
          <div className="mb-12 flex justify-center">
            <Link 
              href="/feedback"
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white dark:text-black rounded-full px-4 py-2 shadow-lg hover:shadow-green-500/60 animate-fade-in-down transition-all transform hover:scale-105"
            >
              <span className="text-xs font-bold">User</span>
              <span className="text-xs font-semibold">Feedback</span>
              <span>→</span>
            </Link>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight text-gray-900 dark:text-white">
            MIT WPU's Department
            <br />
            of Biotechnology
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Seamless bookings. Live availability. Designed for biotech researchers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/equipment"
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-green-500/50"
            >
              Book now
            </Link>
            <Link
              href="#features"
              className="border-2 border-gray-900 dark:border-white hover:bg-gray-900/10 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold py-3 px-8 rounded-lg transition-all text-lg"
            >
              Equipment
            </Link>
            <Link
              href="#guidelines"
              className="border-2 border-gray-400 dark:border-white/30 hover:border-gray-900 dark:hover:border-white/60 text-gray-900 dark:text-white font-bold py-3 px-8 rounded-lg transition-all text-lg"
            >
              Guidelines
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">Key Features</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Everything you need for efficient equipment management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/20 group transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Real-Time Updates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Everything happens instantly across the entire app. Watch slots fill up in real time and get instant notifications.
              </p>
            </div>

            {/* Feature 2 */}
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/20 group transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📱
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">QR Check-In</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Scan QR codes when you arrive and when you leave to track your complete booking session with timestamps.
              </p>
            </div>

            {/* Feature 3 */}
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/20 group transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                View detailed analytics with usage patterns, peak times, and availability trends for better planning.
              </p>
            </div>

            {/* Feature 4 */}
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/20 group transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🖥️
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Equipment Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add, update, and manage equipment with custom categories, locations, and status tracking.
              </p>
            </div>

            {/* Feature 5 */}
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/20 group transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🔐
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enterprise-grade security with role-based access control and encrypted data handling.
              </p>
            </div>

            {/* Feature 6 */}
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/20 group transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📅
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create flexible time slots and automatically prevent double-bookings with our smart scheduling system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 data-animate-fade-in-up className="opacity-0 text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">About Our Lab</h2>
              <p className="text-gray-700 dark:text-gray-400 text-lg mb-4">
                The Department of Biotechnology at MIT-WPU provides state-of-the-art laboratory facilities for research, education, and innovation.
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-lg mb-4">
                Our modern equipment booking system streamlines access to specialized instruments, enabling researchers to focus on discovery while maintaining equipment integrity and fair resource allocation.
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-lg">
                Built with institutional precision and researcher experience in mind, our system makes laboratory resource management seamless.
              </p>
            </div>

            <div data-animate-fade-in-up className="opacity-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">50+</h3>
                  <p className="text-gray-700 dark:text-gray-400">Lab Equipment</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">500+</h3>
                  <p className="text-gray-700 dark:text-gray-400">Active Bookings</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">1000+</h3>
                  <p className="text-gray-700 dark:text-gray-400">Researchers & Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section id="guidelines" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 data-animate-fade-in-up className="opacity-0 text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900 dark:text-white">Guidelines</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">For Users</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-3">✓</span>
                  <span>Only one equipment booking per day per equipment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-3">✓</span>
                  <span>Arrive on time for your booked slot</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-3">✓</span>
                  <span>Show QR code to admin for check-in</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-3">✓</span>
                  <span>Return equipment in good condition</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-3">✓</span>
                  <span>Scan out when finished</span>
                </li>
              </ul>
            </div>

            <div data-animate-fade-in-up className="opacity-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">For Administrators</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-indigo-500 dark:text-indigo-400 mr-3">✓</span>
                  <span>Create and manage equipment inventory</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 dark:text-indigo-400 mr-3">✓</span>
                  <span>Set up available time slots</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 dark:text-indigo-400 mr-3">✓</span>
                  <span>Monitor all bookings in real-time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 dark:text-indigo-400 mr-3">✓</span>
                  <span>Scan QR codes for check-in/out</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 dark:text-indigo-400 mr-3">✓</span>
                  <span>View booking history and analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 data-animate-fade-in-up className="opacity-0 text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900 dark:text-white">Our Team</h2>

          {/* Heads Section */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold mb-12 text-gray-900 dark:text-white">Heads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 justify-items-center">
              {/* Dean Card 1 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/anup.png" 
                    alt="Dr. Anup Kale" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Anup Kale
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Dean</p>
              </div>

              {/* HOD Card 2 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/shilpa.png" 
                    alt="Shilpa Chapadgaonkar" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="https://www.linkedin.com/in/abhay-kachare/" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dr. Shilpa Chapadgaonkar
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Program Director (HoD)</p>
              </div>
            </div>
          </div>

          {/* Core Team Section */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold mb-12 text-gray-900 dark:text-white">Core Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 justify-items-center">
              {/* Core Team Card 1 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/om.png" 
                    alt="public/om.png" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Om Jawanjal
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Creator & Developer</p>
              </div>

              {/* Core Team Card 2 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/subhajit.png" 
                    alt="Subjhajit Dolai" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Subjhajit Dolai
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Operator</p>
              </div>
            </div>
          </div>

          {/* Faculty Section */}
          <div>
            <h3 className="text-2xl font-bold mb-12 text-gray-900 dark:text-white">Faculty</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {/* Faculty Card 1 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/mukul.png" 
                    alt="Mukul Godbole" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Mukul Godbole
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 2 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/rehan.png" 
                    alt="Dr Rehan Deshmukh" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr Rehan Deshmukh
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 3 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/shikha.png" 
                    alt="Dr. Shikha Gaikwad" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Shikha Gaikwad
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 4 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/tj.png" 
                    alt="Tejaswini Pachpor" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Tejaswini Pachpor
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 5 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/amruta.png" 
                    alt="Dr. Amruta Naik" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Amruta Naik
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

               {/* Faculty Card 6 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/nithya.png" 
                    alt="Dr. Nithya N Kutty" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Nithya N Kutty
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 7 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/manasi.png" 
                    alt="Dr. Manasi Mishra" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Manasi Mishra
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

               {/* Faculty Card 8 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/bishnudeo.png" 
                    alt="Dr. Bishnudeo Roy" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Bishnudeo Roy
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 9 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/shalaka.png" 
                    alt="Dr. Shalaka Patil" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Shalaka Patil
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 11 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/kausik.png" 
                    alt="Dr. Kausik Bhattacharyya" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Kausik Bhattacharyya
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 12 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/sachin.png" 
                    alt="Dr. Sachin Harle" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Sachin Harle
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 13 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/neha.png" 
                    alt="Dr. Neha Bokey" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dr. Neha Bokey
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 14 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/mandar.png" 
                    alt="Dr. Mandar Bopardikar" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                 Dr. Mandar Bopardikar
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 15 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/amit.png" 
                    alt="Dr. Amit Kumar" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                Dr. Amit Kumar
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

               {/* Faculty Card 16 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/meenakshi.png" 
                    alt="Dr. Meenakshi Shankar Iyer" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                Dr. Meenakshi Shankar Iyer
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>

              {/* Faculty Card 17 */}
              <div data-animate-fade-in-up className="opacity-0 text-center">
                <div className="mb-4 flex justify-center">
                  <img 
                    src="/kirtikumar.png" 
                    alt="Dr. Kirtikumar Kondhare" 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <a 
                  href="#" 
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                Dr. Kirtikumar Kondhare
                </a>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Assistant Professor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">MIT-WPU</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Department</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Research</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#guidelines" className="hover:text-gray-900 dark:hover:text-white transition-colors">Guidelines</a></li>
                <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">System</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="/auth/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="/auth/signup" className="hover:text-gray-900 dark:hover:text-white transition-colors">Register</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Connect</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Email</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-700 dark:text-gray-400">
            <p>&copy; <Link href="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white font-semibold transition-colors">LabTime</Link> 2026 MIT-WPU Department of Biotechnology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
