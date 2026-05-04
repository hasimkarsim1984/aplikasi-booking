import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  deleteDoc
} from 'firebase/firestore';
import { 
  Calendar, 
  Clock, 
  Building2, 
  Plus,
  LayoutDashboard,
  Search,
  Lock,
  LogOut,
  Check,
  X,
  MapPin,
  Fingerprint,
  Upload,
  AlertTriangle,
  History,
  ChevronRight,
  PlusCircle,
  Trash2,
  Users,
  Timer,
  Database
} from 'lucide-react';

// Firebase Configuration
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'peminjaman-ruangan-001';

const App = () => {
  const [view, setView] = useState('dashboard'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Authentikasi - Memperbaiki alur sign-in
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Listeners
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    // Listener Ruangan (Public Data)
    const qRooms = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
      setIsLoading(false);
    }, (err) => {
      console.error("Rooms listener error:", err);
      setIsLoading(false);
    });

    // Listener Bookings (Public Data)
    const qBookings = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bookingList = snapshot.docs.map(doc => ({ idBooking: doc.id, ...doc.data() }));
      setBookings(bookingList);
    }, (err) => console.error("Bookings listener error:", err));

    return () => {
      unsubRooms();
      unsubBookings();
    };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = {
    pending: bookings.filter(b => b.status === 'Pending').length,
    approved: bookings.filter(b => b.status === 'Disetujui').length,
    rejected: bookings.filter(b => b.status === 'Ditolak').length,
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (e.target.username.value === 'admin' && e.target.password.value === '123') {
      setIsAdmin(true);
      setView('dashboard');
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  const handleAddRoom = async (newRoom) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms'), newRoom);
      setShowRoomModal(false);
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!user) return;
    if (window.confirm('Hapus ruangan ini?')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id));
      } catch (error) {
        console.error("Error deleting room:", error);
      }
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!user) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', id);
      await setDoc(bookingRef, { status }, { merge: true });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const checkIsOccupied = (roomName) => {
    const nowInMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const today = currentTime.toISOString().split('T')[0];
    
    return bookings.find(b => {
      if (b.namaRuangan === roomName && b.tanggal === today && b.status === 'Disetujui') {
        const [hStart, mStart] = b.jamMulai.split(':').map(Number);
        const [hEnd, mEnd] = b.jamSelesai.split(':').map(Number);
        const start = hStart * 60 + mStart;
        const end = hEnd * 60 + mEnd;
        return nowInMins >= start && nowInMins <= end;
      }
      return false;
    });
  };

  const filteredRooms = rooms.filter(r => 
    r.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.gedung.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(b => 
    b.namaPeminjam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.namaRuangan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-sm animate-pulse">Menghubungkan ke Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer" onClick={() => setView('dashboard')}>
            <Building2 size={28} />
            <span className="hidden md:inline text-slate-800">Ruang<span className="text-blue-600">Pusat</span></span>
          </div>
          
          <div className="flex gap-1 md:gap-2">
            <button onClick={() => setView('dashboard')} className={`p-2 md:px-4 md:py-2 rounded-xl transition flex items-center gap-2 ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
              <LayoutDashboard size={18} /> <span className="hidden md:inline font-semibold text-sm">Ruangan</span>
            </button>
            <button onClick={() => setView('riwayat')} className={`p-2 md:px-4 md:py-2 rounded-xl transition flex items-center gap-2 ${view === 'riwayat' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
              <History size={18} /> <span className="hidden md:inline font-semibold text-sm">Riwayat</span>
            </button>
            {!isAdmin && (
              <button onClick={() => setView('form')} className="p-2 md:px-4 md:py-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition">
                <Plus size={18} /> <span className="hidden md:inline font-semibold text-sm">Booking</span>
              </button>
            )}
            {isAdmin ? (
              <button onClick={() => setIsAdmin(false)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition flex items-center gap-2">
                <LogOut size={18} /> <span className="hidden md:inline font-semibold text-xs uppercase">Keluar Admin</span>
              </button>
            ) : (
              <button onClick={() => setView('login')} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition">
                <Lock size={18} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {view === 'login' && (
          <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-3xl border shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="username" placeholder="Username" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="password" type="password" placeholder="Password" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              {loginError && <p className="text-rose-500 text-xs font-bold">{loginError}</p>}
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">Masuk</button>
            </form>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Status & Jadwal Ruangan</h1>
                <p className="text-slate-500 text-sm italic flex items-center gap-1">
                  <Database size={14} className="text-emerald-500" /> Terhubung ke database awan.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Cari ruangan..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-2xl w-full focus:ring-4 focus:ring-blue-100 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {isAdmin && (
                  <button onClick={() => setShowRoomModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                    <PlusCircle size={18} /> Tambah
                  </button>
                )}
              </div>
            </div>

            {filteredRooms.length === 0 ? (
               <div className="bg-white border p-12 rounded-3xl text-center">
                  <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="font-bold text-slate-400 text-lg">Belum ada data ruangan.</h3>
                  {isAdmin && <p className="text-slate-300 text-sm">Klik tombol Tambah untuk memulai.</p>}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredRooms.map((room) => {
                  const activeBooking = checkIsOccupied(room.nama);
                  const today = currentTime.toISOString().split('T')[0];
                  const upcomingBookings = bookings
                    .filter(b => b.namaRuangan === room.nama && b.status === 'Disetujui' && b.tanggal >= today)
                    .sort((a, b) => (a.tanggal + a.jamMulai).localeCompare(b.tanggal + b.jamMulai));

                  return (
                    <div key={room.id} className={`bg-white rounded-3xl border ${activeBooking ? 'border-orange-200 ring-2 ring-orange-50' : 'border-slate-200'} flex flex-col md:flex-row overflow-hidden hover:shadow-xl transition-all duration-300`}>
                      <div className="p-6 md:w-2/5 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                        <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-wider mb-2">
                          <MapPin size={12} /> {room.gedung} • Lt. {room.lantai}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{room.nama}</h3>
                        <p className="text-slate-400 text-xs mb-4">Kapasitas: {room.kapasitas} Orang</p>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2">
                            {activeBooking ? (
                              <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black animate-pulse uppercase">
                                <Timer size={10} /> Sedang Digunakan
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Tersedia</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-bold text-slate-600">Fasilitas:</span> {room.fasilitas}
                          </div>
                        </div>

                        <div className="mt-auto">
                          {isAdmin ? (
                            <button onClick={() => handleDeleteRoom(room.id)} className="w-full flex items-center justify-center gap-2 py-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition text-xs font-bold"><Trash2 size={14} /> Hapus Ruangan</button>
                          ) : (
                            <button onClick={() => setView('form')} className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-md shadow-blue-100">
                              Booking Ruangan <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-6 flex-1 bg-slate-50/50">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
                          <Users size={14} /> Daftar Peminjam (Jadwal)
                        </h4>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                          {upcomingBookings.length > 0 ? upcomingBookings.map(b => {
                            const isToday = b.tanggal === today;
                            const isNow = activeBooking && b.idBooking === activeBooking.idBooking;

                            return (
                              <div key={b.idBooking} className={`p-3 rounded-2xl border transition-all ${isNow ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{b.namaPeminjam}</div>
                                    <div className="text-[9px] text-blue-500 font-bold flex items-center gap-1 mt-0.5 opacity-80 uppercase tracking-tight">
                                      <Fingerprint size={10} /> {b.nimNip}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                                      <Clock size={10} className="text-blue-400" /> {b.jamMulai} - {b.jamSelesai} WIB
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${isToday ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                      {isToday ? 'HARI INI' : b.tanggal}
                                    </div>
                                  </div>
                                </div>
                                {isNow && <div className="mt-2 text-[9px] font-bold text-orange-600 flex items-center gap-1 uppercase tracking-tighter italic">Sedang Berlangsung...</div>}
                              </div>
                            );
                          }) : (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                              <Calendar size={24} strokeWidth={1.5} className="mb-2 opacity-50" />
                              <p className="text-[10px] italic">Tidak ada jadwal mendatang</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'riwayat' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><History className="text-blue-600" /> Riwayat & Status</h1>
                <p className="text-slate-500 text-sm italic">Data tersimpan secara permanen di database.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full lg:w-auto text-center">
                <div className="bg-white border px-4 py-2 rounded-2xl shadow-sm"><div className="text-[9px] font-black text-blue-500 uppercase">Proses</div><div className="text-lg font-bold text-slate-800">{stats.pending}</div></div>
                <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl shadow-sm"><div className="text-[9px] font-black text-emerald-600 uppercase">Setuju</div><div className="text-lg font-bold text-slate-800">{stats.approved}</div></div>
                <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl shadow-sm"><div className="text-[9px] font-black text-rose-600 uppercase">Tolak</div><div className="text-lg font-bold text-slate-800">{stats.rejected}</div></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">No</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Peminjam</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Ruangan & Waktu</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length > 0 ? filteredBookings.map((booking, index) => (
                    <tr key={booking.idBooking} className="hover:bg-slate-50/80 transition-colors text-sm">
                      <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold uppercase text-xs">{booking.namaPeminjam?.charAt(0)}</div>
                          <div>
                            <div className="font-bold text-slate-800">{booking.namaPeminjam}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-tight"><Fingerprint size={10} /> {booking.nimNip}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-slate-700">{booking.namaRuangan}</div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded"><Calendar size={10}/> {booking.tanggal}</span>
                          <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded"><Clock size={10}/> {booking.jamMulai}-{booking.jamSelesai}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center"><StatusBadge status={booking.status} /></td>
                      {isAdmin && (
                        <td className="px-6 py-5 text-right">
                          {booking.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleUpdateStatus(booking.idBooking, 'Disetujui')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Check size={16} /></button>
                              <button onClick={() => handleUpdateStatus(booking.idBooking, 'Ditolak')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><X size={16} /></button>
                            </div>
                          ) : <span className="text-[10px] text-slate-300 italic uppercase">Selesai</span>}
                        </td>
                      )}
                    </tr>
                  )) : <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-300 italic">Data tidak ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'form' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><Plus className="text-blue-600" /> Form Booking</h2>
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20}/></button>
            </div>
            <BookingForm 
              rooms={rooms} 
              onSubmit={async (data) => { 
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
                  ...data,
                  status: 'Pending',
                  waktuPengajuan: new Date().toISOString()
                });
                setView('riwayat'); 
              }} 
              existingBookings={bookings} 
            />
          </div>
        )}
      </main>

      {showRoomModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><Building2 size={20}/> Daftarkan Ruangan</h3><button onClick={() => setShowRoomModal(false)}><X size={20}/></button></div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleAddRoom({ 
                nama: fd.get('nama'), 
                kapasitas: fd.get('kapasitas'), 
                gedung: fd.get('gedung'), 
                lantai: fd.get('lantai'), 
                fasilitas: fd.get('fasilitas') 
              });
            }} className="p-8 space-y-4">
              <input name="nama" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="Nama Ruangan" />
              <div className="grid grid-cols-2 gap-4">
                <input name="kapasitas" type="number" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="Kapasitas" />
                <input name="lantai" type="number" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="Lantai" />
              </div>
              <select name="gedung" className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none">
                {['A','B','C','D','E','G'].map(g => <option key={g} value={`Gedung ${g}`}>Gedung {g}</option>)}
              </select>
              <textarea name="fasilitas" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="Fasilitas (pisahkan dengan koma)..."></textarea>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold">Simpan Ruangan</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = { "Disetujui": "bg-emerald-100 text-emerald-700 border-emerald-200", "Pending": "bg-blue-100 text-blue-700 border-blue-200", "Ditolak": "bg-rose-100 text-rose-700 border-rose-200" };
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
};

const BookingForm = ({ rooms, onSubmit, existingBookings }) => {
  const [formData, setFormData] = useState({ namaRuangan: '', tanggal: '', jamMulai: '', jamSelesai: '', namaPeminjam: '', nimNip: '', keterangan: '', suratIzin: null });
  const [conflict, setConflict] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [needsSpecialPermit, setNeedsSpecialPermit] = useState(false);

  useEffect(() => {
    if (formData.namaRuangan && formData.tanggal && formData.jamMulai && formData.jamSelesai) {
      const toMins = (t) => { if (!t) return 0; const [h, m] = t.split(':'); return (parseInt(h, 10) * 60) + parseInt(m, 10); };
      const startNew = toMins(formData.jamMulai);
      const endNew = toMins(formData.jamSelesai);
      
      setTimeError(startNew >= endNew);

      setConflict(existingBookings.some(b => b.namaRuangan === formData.namaRuangan && b.tanggal === formData.tanggal && b.status !== 'Ditolak' && (startNew < toMins(b.jamSelesai)) && (endNew > toMins(b.jamMulai))));
      
      const day = new Date(formData.tanggal).getDay();
      setNeedsSpecialPermit(day === 0 || day === 6 || startNew < 420 || endNew > 1020);
    }
  }, [formData, existingBookings]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if(!conflict && !timeError) onSubmit(formData); }} className="space-y-5">
      {timeError && (
        <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 font-bold text-xs animate-shake">
          <Clock size={20} className="shrink-0" />
          <span>Waktu tidak valid! Jam mulai harus lebih awal dari jam selesai.</span>
        </div>
      )}

      {conflict && !timeError && (
        <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl flex items-center gap-3 text-orange-700 font-bold text-xs">
          <AlertTriangle size={20} className="shrink-0" />
          <span>Jadwal Bentrok! Ruangan sudah dipesan pada waktu tersebut.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Nama Lengkap" className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, namaPeminjam: e.target.value})} />
        <input required placeholder="NIM / NIP" className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, nimNip: e.target.value})} />
      </div>
      <select required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, namaRuangan: e.target.value})}>
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map(r => <option key={r.id} value={r.nama}>{r.nama}</option>)}
      </select>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Tanggal</label>
          <input type="date" required className="w-full px-3 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Mulai</label>
          <input type="time" required className={`w-full px-3 py-3 border rounded-xl outline-none focus:ring-2 ${timeError ? 'bg-rose-50 border-rose-300 ring-rose-100' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`} onChange={(e) => setFormData({...formData, jamMulai: e.target.value})} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Selesai</label>
          <input type="time" required className={`w-full px-3 py-3 border rounded-xl outline-none focus:ring-2 ${timeError ? 'bg-rose-50 border-rose-300 ring-rose-100' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`} onChange={(e) => setFormData({...formData, jamSelesai: e.target.value})} />
        </div>
      </div>
      {needsSpecialPermit && (
        <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-blue-50/30 relative hover:border-blue-300 transition-colors">
          <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="text-blue-400" size={20} />
          <span className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tight text-center px-4">Butuh Surat Izin (Luar Jam Kerja/Libur)</span>
          <span className="text-[9px] text-slate-400">Pilih File atau Drag & Drop</span>
        </div>
      )}
      <textarea required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none min-h-[100px] focus:ring-2 focus:ring-blue-500" placeholder="Detail Kegiatan..." onChange={(e) => setFormData({...formData, keterangan: e.target.value})}></textarea>
      <button 
        disabled={conflict || timeError} 
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold disabled:bg-slate-300 shadow-lg shadow-blue-100 hover:bg-blue-700 transition transform active:scale-95 disabled:cursor-not-allowed"
      >
        Ajukan Peminjaman
      </button>
    </form>
  );
};

export default App;
