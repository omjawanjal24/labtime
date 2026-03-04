'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';
import { Navbar } from '@/components/Navbar';

interface Equipment {
  id: string;
  name: string;
  description: string;
  location: string;
  image_url: string | null;
  is_active: boolean;
}

export default function EquipmentPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // Check session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.push('/auth/login');
          return;
        }

        // Load active equipment
        console.log('Loading equipment with filter: is_active=true');
        
        let { data: equipmentData, error } = await supabase
          .from('equipment')
          .select('*')
          .eq('is_active', true);

        // Fallback: if error, try loading all equipment and filter on client side
        if (error) {
          console.warn('Filter query failed, trying without filters...', error);
          const { data: allEquipmentData, error: fallbackError } = await supabase
            .from('equipment')
            .select('*');
          
          if (!fallbackError && allEquipmentData) {
            // Manually filter on client side
            equipmentData = allEquipmentData.filter(e => e.is_active);
            console.log('Fallback: loaded and filtered', equipmentData.length, 'active equipment');
            error = null;
          } else {
            console.error('Fallback query also failed:', fallbackError);
          }
        }

        if (error) {
          console.error('Error loading equipment:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          // Even with error, try to set empty state
          setEquipment([]);
        } else {
          console.log('Equipment loaded successfully:', equipmentData?.length || 0, 'items');
          setEquipment(equipmentData || []);
        }

        // Subscribe to real-time updates on equipment table
        const channel = supabase
          .channel('equipment-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'equipment',
              filter: 'is_active=eq.true',
            },
            (payload: any) => {
              console.log('Equipment change:', payload.eventType, payload.new || payload.old);
              
              // Handle INSERT
              if (payload.eventType === 'INSERT') {
                const newEquip = payload.new;
                if (newEquip.is_active) {
                  setEquipment(prev => {
                    if (prev.some(e => e.id === newEquip.id)) {
                      return prev.map(e => e.id === newEquip.id ? newEquip : e);
                    }
                    return [...prev, newEquip];
                  });
                }
              }
              // Handle UPDATE
              else if (payload.eventType === 'UPDATE') {
                const updatedEquip = payload.new;
                console.log('Equipment updated:', updatedEquip);
                
                if (updatedEquip.is_active) {
                  setEquipment(prev => {
                    const exists = prev.some(e => e.id === updatedEquip.id);
                    if (exists) {
                      return prev.map(e => e.id === updatedEquip.id ? updatedEquip : e);
                    }
                    return [...prev, updatedEquip];
                  });
                } else {
                  // Remove if deactivated
                  setEquipment(prev => prev.filter(e => e.id !== updatedEquip.id));
                }
              }
              // Handle DELETE
              else if (payload.eventType === 'DELETE') {
                setEquipment(prev => prev.filter(e => e.id !== payload.old.id));
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });

        setLoading(false);

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('Exception in loadData:', err);
        setEquipment([]);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-900 dark:border-blue-900 border-t-blue-500 dark:border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading equipment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Available Equipment</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Browse and book lab equipment for your research</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search equipment by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-6 py-3 ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
            />
            <svg className={`absolute right-4 top-3.5 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Equipment Grid */}
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-16">
            <svg className={`w-16 h-16 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-400'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>No equipment found</h3>
            <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/book/${item.id}`}
              >
                <div className={`group ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-blue-500 hover:shadow-blue-600/20' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-blue-500/20'} rounded-xl overflow-hidden border transition-all hover:shadow-2xl cursor-pointer h-full`}>
                  {/* Image */}
                  <div className={`h-48 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30' : 'bg-gradient-to-br from-blue-100 to-indigo-100'} flex items-center justify-center overflow-hidden relative`}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <svg className={`w-20 h-20 ${theme === 'dark' ? 'text-gray-700 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-blue-600'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'} transition-colors`}>{item.name}</h3>
                    {item.description && (
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-3 line-clamp-2`}>{item.description}</p>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      {item.location && (
                        <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} text-sm flex items-center`}>
                          <svg className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {item.location}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-block bg-green-900/30 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-700 dark:border-green-700">
                        ✓ Available
                      </span>
                      <span className={`font-semibold text-sm group-hover:translate-x-1 transition-transform ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
