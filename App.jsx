import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Layout, 
  Calendar, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  Trash2,
  Lock,
  LogOut,
  Info,
  AlertTriangle
} from 'lucide-react';

// ==============================================================================
// PENTING: Buka Firebase Console (https://console.firebase.google.com/)
// 1. Pilih Proyek Anda > Project Settings (Ikon Gerigi)
// 2. Scroll ke bawah ke bagian "Your apps"
// 3. Salin nilai dari objek "firebaseConfig" dan tempel di bawah ini
// ==============================================================================
const firebaseConfig = {
  apiKey: "ISI_API_KEY_ANDA", // Ganti dengan API Key asli (misal: AIzaSy...)
  authDomain: "PROYEK-ANDA.firebaseapp.com",
  projectId: "PROYEK-ANDA",
  storageBucket: "PROYEK-ANDA.appspot.com",
  messagingSenderId: "NOMOR_SENDER",
  appId: "ID_APLIKASI_ANDA"
};

// Fungsi pengecekan apakah konfigurasi sudah diisi
const isConfigValid = firebaseConfig.apiKey !== "ISI_API_KEY_ANDA";

let db, auth;

if (isConfigValid) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

const appId = "peminjaman-ruangan-001";

const App = () => {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(isConfigValid);

  const [formData, setFormData] = useState({
    namaPeminjam: '', nimNip: '', namaRuangan: '', tanggal: '', jamMulai: '', jamSelesai: '', keterangan: ''
  });

  const [roomData, setRoomData] = useState({
    nama: '', gedung: '', lantai: '', kapasitas: '', fasilitas: ''
  });

  useEffect(() => {
    if (!isConfigValid) return;

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const qRooms = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
        const unsubRooms = onSnapshot(qRooms, (snapshot) => {
          setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        }, (err) => console.error("Room error:", err));

        const qBookings = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');
        const unsubBookings = onSnapshot(qBookings, (snapshot) => {
          setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("Booking error:", err));

        return () => {
          unsubRooms();
          unsubBookings();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Handlers
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isConfigValid || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
        ...formData,
        status: 'Pending',
        timestamp: new Date().toISOString()
      });
      alert("Pengajuan berhasil dikirim!");
      setView('dashboard');
      setFormData({ namaPeminjam: '', nimNip: '', namaRuangan: '', tanggal: '', jamMulai: '', jamSelesai: '', keterangan: '' });
    } catch (err) { console.error(err); }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms'), roomData);
      setRoomData({ nama: '', gedung: '', lantai: '', kapasitas: '', fasilitas: '' });
      alert("Ruangan berhasil ditambah!");
    } catch (err) { console.error(err); }
  };

  const updateBookingStatus = async (id, status) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', id);
    await updateDoc(docRef, { status });
  };

  const handleAdminLogin = () => {
    const userPrompt = prompt("Username:");
    const passPrompt = prompt("Password:");
    if (userPrompt === 'admin' && passPrompt === '123') {
      setIsAdmin(true);
      alert("Login Admin Berhasil");
    } else {
      alert("Login Gagal");
    }
  };

  // Tampilan jika Konfigurasi Belum Diisi
  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-amber-100 max-w-md">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2 text-slate-800">Firebase Belum Siap</h1>
          <p className="text-slate-500 text-sm mb-6">
            Anda perlu memasukkan <b>Firebase Config</b> asli ke dalam file <code>App.jsx</code> di GitHub agar aplikasi dapat terhubung ke database.
          </p>
          <div className="bg-slate-800 text-white p-3 rounded-xl text-left text-xs font-mono mb-4 overflow-x-auto">
            const firebaseConfig = &#123;<br/>
            &nbsp;&nbsp;apiKey: "AIzaSy...",<br/>
            &nbsp;&nbsp;...<br/>
            &#125;
          </div>
          <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Buka Firebase Console
          </a>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-screen font-sans">Menghubungkan ke database...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Building className="text-blue-600" size={24} />
          <h1 className="font-bold text-lg tracking-tight">E-Booking Ruangan</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin ? (
            <button onClick={handleAdminLogin} className="p-2 hover:bg-slate-100 rounded-full">
              <Lock size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <span className="text-xs font-semibold text-blue-700">ADMIN MODE</span>
              <button onClick={() => setIsAdmin(false)} className="text-blue-700"><LogOut size={16}/></button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 mt-4">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold">Status Ruangan</h2>
                <p className="text-slate-500 text-sm">Daftar ruangan tersedia saat ini</p>
              </div>
              <button onClick={() => setView('booking')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                <Plus size={18} /> Booking
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                      <Layout size={24} />
                    </div>
                    {isAdmin && (
                      <button onClick={async () => {
                        if(confirm('Hapus ruangan?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id));
                      }} className="text-red-400 p-1"><Trash2 size={18} /></button>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{room.nama}</h3>
                  <p className="text-slate-500 text-sm mb-4">{room.gedung}, Lantai {room.lantai}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                    <div className="bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <User size={14} className="text-slate-400" /> {room.kapasitas} Orang
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 truncate">
                      <Info size={14} className="text-slate-400" /> {room.fasilitas}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {rooms.length === 0 && <div className="text-center py-12 text-slate-400 italic">Belum ada ruangan yang terdaftar.</div>}
          </div>
        )}

        {view === 'booking' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-blue-600" /> Form Peminjaman
            </h2>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <input required placeholder="Nama Lengkap" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={formData.namaPeminjam} onChange={e => setFormData({...formData, namaPeminjam: e.target.value})} />
                <input required placeholder="NIM / NIP" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={formData.nimNip} onChange={e => setFormData({...formData, nimNip: e.target.value})} />
                <select required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" value={formData.namaRuangan} onChange={e => setFormData({...formData, namaRuangan: e.target.value})}>
                  <option value="">Pilih Ruangan</option>
                  {rooms.map(r => <option key={r.id} value={r.nama}>{r.nama}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                     <label className="text-xs text-slate-500 ml-1">Tanggal</label>
                     <input required type="date" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs text-slate-500 ml-1">Jam Mulai</label>
                     <input required type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" value={formData.jamMulai} onChange={e => setFormData({...formData, jamMulai: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 ml-1">Jam Selesai</label>
                  <input required type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" value={formData.jamSelesai} onChange={e => setFormData({...formData, jamSelesai: e.target.value})} />
                </div>
                <textarea placeholder="Tujuan / Keterangan" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl h-24" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})}></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setView('dashboard')} className="flex-1 border border-slate-200 py-3 rounded-xl font-semibold">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Kirim</button>
              </div>
            </form>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">Riwayat Pengajuan</h2>
             {bookings.length === 0 ? (
               <div className="text-center py-12 text-slate-400">Belum ada riwayat booking.</div>
             ) : (
               bookings.map((book) => (
                 <div key={book.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-start">
                     <div>
                       <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                         book.status === 'Disetujui' ? 'bg-green-100 text-green-700' : 
                         book.status === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {book.status}
                       </span>
                       <h3 className="font-bold text-lg mt-2">{book.namaRuangan}</h3>
                       <p className="text-sm text-slate-600 font-medium">{book.namaPeminjam} ({book.nimNip})</p>
                     </div>
                     {isAdmin && book.status === 'Pending' && (
                       <div className="flex gap-2">
                         <button onClick={() => updateBookingStatus(book.id, 'Disetujui')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><CheckCircle size={20}/></button>
                         <button onClick={() => updateBookingStatus(book.id, 'Ditolak')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle size={20}/></button>
                       </div>
                     )}
                   </div>
                   <div className="mt-4 flex gap-4 text-xs text-slate-500 border-t border-slate-50 pt-3">
                     <span className="flex items-center gap-1"><Calendar size={14}/> {book.tanggal}</span>
                     <span className="flex items-center gap-1"><Clock size={14}/> {book.jamMulai} - {book.jamSelesai}</span>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-6">Tambah Ruangan Baru</h2>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <input required placeholder="Nama Ruangan" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={roomData.nama} onChange={e => setRoomData({...roomData, nama: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Gedung" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={roomData.gedung} onChange={e => setRoomData({...roomData, gedung: e.target.value})} />
                <input required placeholder="Lantai" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={roomData.lantai} onChange={e => setRoomData({...roomData, lantai: e.target.value})} />
              </div>
              <input required type="number" placeholder="Kapasitas (Orang)" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={roomData.kapasitas} onChange={e => setRoomData({...roomData, kapasitas: e.target.value})} />
              <input required placeholder="Fasilitas (pisahkan dengan koma)" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={roomData.fasilitas} onChange={e => setRoomData({...roomData, fasilitas: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Simpan Ruangan</button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Layout size={20} />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Clock size={20} />
          <span className="text-[10px] font-bold">Riwayat</span>
        </button>
        {isAdmin && (
          <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Plus size={20} />
            <span className="text-[10px] font-bold">Admin</span>
          </button>
        )}
      </nav>

      {/* Desktop Navigation */}
      <div className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 ml-4 rounded-2xl flex-col p-2 shadow-xl gap-4">
        <button onClick={() => setView('dashboard')} className={`p-3 rounded-xl ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}><Layout/></button>
        <button onClick={() => setView('history')} className={`p-3 rounded-xl ${view === 'history' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}><Clock/></button>
        {isAdmin && <button onClick={() => setView('admin')} className={`p-3 rounded-xl ${view === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}><Plus/></button>}
      </div>
    </div>
  );
};

export default App;
