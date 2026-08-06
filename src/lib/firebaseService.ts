import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  FieldValue
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Anime, Comment, Message, User, toSlug } from '../types';

// Helper to convert Firestore document to Anime type
function mapDocToAnime(docSnap: any): Anime {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || '',
    description: data.description || '',
    image_url: data.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
    banner_url: data.banner_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200',
    rating: data.rating || 0,
    rating_count: data.rating_count || 0,
    holati: data.holati || 'Faol',
    yil: data.yil || null,
    studiyasi: data.studiyasi || '',
    qismlar_soni: data.qismlar_soni || 0,
    janrlar: data.janrlar || '',
    video_url: data.video_url || '',
    tavsiya: !!data.tavsiya,
    created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
  };
}

// Initial high-quality seed data
const DEFAULT_ANIMES = [
  {
    title: "Solo Leveling",
    description: "Sung Jinwoo is an E-class hunter, the weakest of all. After a mysterious run in a double dungeon, he awakens with a unique interface that allows him to level up infinitely. Follow his journey as he rises from the weakest to the strongest hunter in the world.",
    image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500",
    banner_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
    rating: 4.9,
    rating_count: 312,
    holati: "Tugallangan",
    yil: 2024,
    studiyasi: "A-1 Pictures",
    qismlar_soni: 12,
    janrlar: "Jangari, Sarguzasht, Fantastika",
    video_url: "/assets/sample/video.mp4",
    tavsiya: true
  },
  {
    title: "Demon Slayer: Kimetsu no Yaiba",
    description: "Tanjirou Kamado is a kindhearted boy whose family is slaughtered by demons. His only surviving sister, Nezuko, is turned into a demon herself. Determined to cure her and avenge his family, Tanjirou joins the Demon Slayer Corps.",
    image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500",
    banner_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200",
    rating: 4.8,
    rating_count: 425,
    holati: "Efirda",
    yil: 2019,
    studiyasi: "ufotable",
    qismlar_soni: 26,
    janrlar: "Jangari, Fantastika, Dahshatli",
    video_url: "/assets/sample/video.mp4",
    tavsiya: true
  },
  {
    title: "Jujutsu Kaisen",
    description: "Yuji Itadori is a high school student who swallows a rotting finger of the legendary King of Curses, Ryomen Sukuna, to save his friends. Becoming the host of Sukuna, he is admitted into the Tokyo Prefectural Jujutsu High School to help eliminate curses.",
    image_url: "https://images.unsplash.com/photo-1541562232579-512a21360020?w=500",
    banner_url: "https://images.unsplash.com/photo-1541562232579-512a21360020?w=1200",
    rating: 4.7,
    rating_count: 289,
    holati: "Tugallangan",
    yil: 2020,
    studiyasi: "MAPPA",
    qismlar_soni: 24,
    janrlar: "Jangari, Fantastika, Supernatural",
    video_url: "/assets/sample/video.mp4",
    tavsiya: false
  }
];

export const firebaseService = {
  // --- USER PROFILE ---
  async syncUserProfile(uid: string, name: string, email: string): Promise<User> {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: uid,
        name: data.name || name,
        role: data.role || 'user',
        email: data.email || email
      };
    } else {
      // Determine if they should be admin (default Jasmin admin logic or if jasmine email)
      const isAdminEmail = email.toLowerCase().includes('admin') || email.toLowerCase().includes('mosinjonov');
      const role = isAdminEmail ? 'admin' : 'user';
      const newUser: User = { id: uid, name, role, email };
      
      await setDoc(userDocRef, {
        name,
        email,
        role,
        favorites: [],
        history: [],
        created_at: serverTimestamp()
      });
      return newUser;
    }
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: uid,
      name: data.name || '',
      role: data.role || 'user',
      email: data.email || ''
    };
  },

  // --- ANIME DATA ---
  async getAnimes(): Promise<Anime[]> {
    const colRef = collection(db, 'animes');
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log("Firestore empty. Seeding default high-quality anime data...");
      const seeded: Anime[] = [];
      for (const item of DEFAULT_ANIMES) {
        const docRef = await addDoc(colRef, {
          ...item,
          created_at: serverTimestamp()
        });
        
        // Seed default episode 1 for each seeded anime
        await addDoc(collection(db, 'episodes'), {
          anime_id: docRef.id,
          episode_number: 1,
          video_url: item.video_url,
          created_at: serverTimestamp()
        });

        seeded.push({
          id: docRef.id,
          ...item,
          created_at: new Date().toISOString()
        });
      }
      return seeded;
    }

    return snapshot.docs.map(mapDocToAnime);
  },

  async getAnimeByIdOrSlug(idOrSlug: string): Promise<Anime | null> {
    // 1. Try directly fetching by ID
    try {
      const docSnap = await getDoc(doc(db, 'animes', idOrSlug));
      if (docSnap.exists()) {
        return mapDocToAnime(docSnap);
      }
    } catch (e) {}

    // 2. Try looking up by matched slug of title
    const colRef = collection(db, 'animes');
    const snapshot = await getDocs(colRef);
    for (const d of snapshot.docs) {
      if (toSlug(d.data().title) === idOrSlug) {
        return mapDocToAnime(d);
      }
    }

    return null;
  },

  async addAnime(animeData: Omit<Anime, 'id' | 'created_at' | 'rating' | 'rating_count'>): Promise<Anime> {
    const colRef = collection(db, 'animes');
    const docRef = await addDoc(colRef, {
      ...animeData,
      rating: 4.5,
      rating_count: 1,
      created_at: serverTimestamp()
    });

    // Automatically seed an episode 1 with the default video_url
    if (animeData.video_url) {
      await addDoc(collection(db, 'episodes'), {
        anime_id: docRef.id,
        episode_number: 1,
        video_url: animeData.video_url,
        created_at: serverTimestamp()
      });
    }

    const newSnap = await getDoc(docRef);
    return mapDocToAnime(newSnap);
  },

  async updateAnime(id: string, animeData: Partial<Anime>): Promise<void> {
    const docRef = doc(db, 'animes', id);
    const { id: _, created_at: __, ...updateFields } = animeData as any;
    await updateDoc(docRef, updateFields);
  },

  async deleteAnime(id: string): Promise<void> {
    await deleteDoc(doc(db, 'animes', id));
    
    // Also clean up associated episodes and comments
    const epSnap = await getDocs(query(collection(db, 'episodes'), where('anime_id', '==', id)));
    for (const d of epSnap.docs) {
      await deleteDoc(doc(db, 'episodes', d.id));
    }

    const comSnap = await getDocs(query(collection(db, 'comments'), where('anime_id', '==', id)));
    for (const d of comSnap.docs) {
      await deleteDoc(doc(db, 'comments', d.id));
    }
  },

  // --- EPISODES ---
  async getEpisodes(animeId: string): Promise<any[]> {
    const colRef = collection(db, 'episodes');
    const q = query(colRef, where('anime_id', '==', animeId), orderBy('episode_number', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // If empty, look up the anime's main video_url and create episode 1
      const anime = await this.getAnimeByIdOrSlug(animeId);
      if (anime && anime.video_url) {
        const defaultEp = {
          anime_id: anime.id,
          episode_number: 1,
          video_url: anime.video_url
        };
        await addDoc(colRef, {
          ...defaultEp,
          created_at: serverTimestamp()
        });
        return [{ id: 'default-ep-1', ...defaultEp }];
      }
    }

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  },

  async saveEpisode(animeId: string, episodeNum: number, videoUrl: string): Promise<void> {
    const colRef = collection(db, 'episodes');
    const q = query(colRef, where('anime_id', '==', animeId), where('episode_number', '==', episodeNum));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Update existing
      const existingDocId = snapshot.docs[0].id;
      await updateDoc(doc(db, 'episodes', existingDocId), { video_url: videoUrl });
    } else {
      // Create new
      await addDoc(colRef, {
        anime_id: animeId,
        episode_number: episodeNum,
        video_url: videoUrl,
        created_at: serverTimestamp()
      });
    }
  },

  async deleteEpisode(animeId: string, episodeNum: number): Promise<void> {
    const colRef = collection(db, 'episodes');
    const q = query(colRef, where('anime_id', '==', animeId), where('episode_number', '==', episodeNum));
    const snapshot = await getDocs(q);

    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'episodes', d.id));
    }
  },

  // --- COMMENTS ---
  async getComments(animeId: string): Promise<Comment[]> {
    const q = query(
      collection(db, 'comments'), 
      where('anime_id', '==', animeId), 
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        anime_id: data.anime_id,
        user_id: data.user_id,
        user_name: data.user_name || 'Anonymous',
        content: data.content,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
  },

  async addComment(animeId: string, userId: string, userName: string, content: string): Promise<Comment> {
    const colRef = collection(db, 'comments');
    const docRef = await addDoc(colRef, {
      anime_id: animeId,
      user_id: userId,
      user_name: userName,
      content,
      created_at: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      anime_id: animeId,
      user_id: userId,
      user_name: userName,
      content,
      created_at: new Date().toISOString()
    };
  },

  async deleteComment(commentId: string): Promise<void> {
    await deleteDoc(doc(db, 'comments', commentId));
  },

  async getRecentComments(): Promise<Comment[]> {
    const q = query(
      collection(db, 'comments'), 
      orderBy('created_at', 'desc'), 
      limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        anime_id: data.anime_id,
        user_id: data.user_id,
        user_name: data.user_name || 'Anonymous',
        content: data.content,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
  },

  // --- CHAT MESSAGES ---
  subscribeChat(callback: (messages: Message[]) => void) {
    const q = query(collection(db, 'messages'), orderBy('created_at', 'asc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id,
          user_name: data.user_name || 'Anonymous',
          content: data.content,
          reply_to_id: data.reply_to_id || null,
          reply_to_name: data.reply_to_name || null,
          reply_to_content: data.reply_to_content || null,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
      callback(messages);
    });
  },

  async sendChatMessage(
    userId: string, 
    userName: string, 
    content: string, 
    replyTo?: { id: string; name: string; content: string } | null
  ): Promise<void> {
    const colRef = collection(db, 'messages');
    await addDoc(colRef, {
      user_id: userId,
      user_name: userName,
      content,
      reply_to_id: replyTo?.id || null,
      reply_to_name: replyTo?.name || null,
      reply_to_content: replyTo?.content || null,
      created_at: serverTimestamp()
    });
  },

  async deleteChatMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, 'messages', messageId));
  },

  async clearChat(): Promise<void> {
    const colRef = collection(db, 'messages');
    const snapshot = await getDocs(colRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'messages', d.id));
    }
  },

  // --- FAVORITES & HISTORY ---
  async getFavorites(userId: string): Promise<string[]> {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) return [];
    return docSnap.data().favorites || [];
  },

  async toggleFavorite(userId: string, animeId: string): Promise<boolean> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    
    const favs: string[] = docSnap.data().favorites || [];
    const isFav = favs.includes(animeId);
    
    await updateDoc(docRef, {
      favorites: isFav ? arrayRemove(animeId) : arrayUnion(animeId)
    });
    return !isFav;
  },

  async getHistory(userId: string): Promise<any[]> {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) return [];
    return docSnap.data().history || [];
  },

  async addToHistory(userId: string, animeId: string, episodeNum: number): Promise<void> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const historyList: any[] = docSnap.data().history || [];
    // Remove if already exists to move to top
    const filteredList = historyList.filter(item => item.anime_id !== animeId);
    
    const newEntry = {
      anime_id: animeId,
      episode_number: episodeNum,
      watched_at: new Date().toISOString()
    };

    await updateDoc(docRef, {
      history: [newEntry, ...filteredList].slice(0, 50) // keep last 50
    });
  }
};
