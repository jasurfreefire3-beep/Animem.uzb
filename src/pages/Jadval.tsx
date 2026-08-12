import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Bell, BellOff, Calendar, Clock, Film } from 'lucide-react';
import { motion } from 'motion/react';

export default function Jadval() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay() || 7); // 1 = Monday, ..., 7 = Sunday
  const [notifications, setNotifications] = useState<Record<number, boolean>>({});

  const weekdays = [
    { id: 1, name: 'Dushanba' },
    { id: 2, name: 'Seshanba' },
    { id: 3, name: 'Chorshanba' },
    { id: 4, name: 'Payshanba' },
    { id: 5, name: 'Juma' },
    { id: 6, name: 'Shanba' },
    { id: 7, name: 'Yakshanba' },
  ];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/animes`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAnimes(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching animes:", err);
        setLoading(false);
      }
    };
    fetchSchedule();

    // Load notification state
    const savedNotifications = localStorage.getItem('anime_schedule_reminders');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleNotification = (animeId: string) => {
    const updated = { ...notifications, [animeId]: !notifications[animeId] };
    setNotifications(updated as any);
    localStorage.setItem('anime_schedule_reminders', JSON.stringify(updated));
  };

  // Map anime to day and schedule time deterministically so it's always stable and looks beautiful
  const getScheduleForDay = (dayId: number) => {
    return animes
      .filter((anime) => {
        // Deterministic day assignment based on string ID hash
        let hash = 0;
        const idStr = String(anime.id);
        for (let i = 0; i < idStr.length; i++) {
          hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        const assignedDay = Math.abs(hash % 7) + 1;
        return assignedDay === dayId;
      })
      .map((anime, index) => {
        // Deterministic release times
        const times = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:15'];
        const time = times[index % times.length];
        
        // Deterministic episode info
        const mockEpisodeNum = (anime.qismlar_soni || 12) + (index * 2) + 1;
        
        return {
          ...anime,
          time,
          episodeText: `${mockEpisodeNum}-qism yangi yuklanadi`,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeDaySchedule = getScheduleForDay(activeDay);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden">
        <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#ff006a]" /> Jadval (Schedule)
        </h1>
        <p className="text-white/50 text-xs mt-1">Yangi epizodlar chiqish kunlari va soatlari</p>
      </div>

      {/* Weekday Switcher Tabs */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-1 flex space-x-1 overflow-x-auto custom-scrollbar">
        {weekdays.map((day) => {
          const isActive = activeDay === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`flex-1 py-3 px-4 rounded-sm text-xs font-bold transition-all text-center whitespace-nowrap ${
                isActive 
                  ? 'bg-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.3)]' 
                  : 'text-white/50 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              {day.name}
            </button>
          );
        })}
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3">
        {activeDaySchedule.map((item, idx) => {
          const isNotified = !!notifications[item.id];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-[#111] border border-[#222] p-4 rounded-sm flex items-center justify-between hover:border-[#ff006a]/30 transition-all group"
            >
              {/* Left Details: Time, Cover, Info */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Time Indicator */}
                <div className="text-[#ff006a] font-mono font-black text-sm tracking-wide bg-[#ff006a]/5 border border-[#ff006a]/10 px-3 py-1.5 rounded-sm shrink-0 flex items-center gap-1">
                  <Clock size={12} />
                  {item.time}
                </div>

                {/* Cover Thumbnail */}
                <Link to={`/anime/${toSlug(item.title)}`} title={item.title} className="w-10 h-14 bg-[#000] rounded-sm overflow-hidden border border-[#222] shrink-0 block">
                  <img loading="lazy" decoding="async" 
                    src={item.image_url} 
                    alt={item.title} 
                    title={item.title} 
                    className="w-full h-full object-cover" 
                  />
                </Link>

                {/* Title & Episode No */}
                <div className="min-w-0 flex-1">
                  <Link to={`/anime/${toSlug(item.title)}`} className="text-white font-bold text-sm hover:text-[#ff006a] transition-colors truncate block">
                    {item.title}
                  </Link>
                  <p className="text-white/40 text-[11px] font-medium font-mono mt-0.5 uppercase tracking-wide">
                    {item.episodeText}
                  </p>
                </div>
              </div>

              {/* Action: Toggle Notification reminder */}
              <div className="flex items-center space-x-3 ml-4">
                <button
                  onClick={() => toggleNotification(item.id)}
                  className={`p-2.5 rounded-sm transition-all border ${
                    isNotified
                      ? 'bg-[#ff006a]/10 border-[#ff006a] text-[#ff006a]'
                      : 'bg-[#000] border-[#222] text-white/40 hover:text-white hover:border-[#333]'
                  }`}
                  title={isNotified ? "Eslatmani bekor qilish" : "Eslatishni yoqish"}
                >
                  {isNotified ? <Bell size={15} className="fill-current" /> : <Bell size={15} />}
                </button>
                <Link
                  to={`/anime/${toSlug(item.title)}`}
                  className="bg-[#222] hover:bg-[#333] border border-[#333] hover:border-white/10 text-white font-bold text-xs px-4 py-2 rounded-sm transition-colors"
                >
                  Tafsilotlar
                </Link>
              </div>
            </motion.div>
          );
        })}

        {activeDaySchedule.length === 0 && (
          <div className="text-center py-16 bg-[#111] border border-[#222] rounded-sm space-y-3">
            <Film className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-white/50 text-sm font-bold">Ushbu kunda yangi epizodlar yuklanishi rejalashtirilmagan.</p>
            <p className="text-white/30 text-xs">Iltimos, haftaning boshqa kunlarini tekshirib ko'ring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
