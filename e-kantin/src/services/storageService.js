const STORAGE_KEYS = {
  STUDENTS: 'kantin_students',
  STAFF: 'kantin_staff', // Added for V14
  CARDS: 'kantin_cards',
  PRODUCTS: 'kantin_products',
  TRANSACTIONS: 'kantin_transactions',
  WISHES: 'kantin_wishes',
  ANNOUNCEMENTS: 'kantin_announcements',
  REVIEWS: 'kantin_reviews',
  WASTE: 'kantin_waste',
  FAVORITES: 'kantin_favorites',
};

const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  getStudents: () => getFromStorage(STORAGE_KEYS.STUDENTS),
  saveStudents: (students) => saveToStorage(STORAGE_KEYS.STUDENTS, students),
  
  getStaff: () => getFromStorage(STORAGE_KEYS.STAFF),
  saveStaff: (staff) => saveToStorage(STORAGE_KEYS.STAFF, staff),
  
  getCards: () => getFromStorage(STORAGE_KEYS.CARDS),
  saveCards: (cards) => saveToStorage(STORAGE_KEYS.CARDS, cards),
  
  getProducts: () => getFromStorage(STORAGE_KEYS.PRODUCTS),
  saveProducts: (products) => saveToStorage(STORAGE_KEYS.PRODUCTS, products),
  
  getTransactions: () => getFromStorage(STORAGE_KEYS.TRANSACTIONS),
  saveTransactions: (transactions) => saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions),

  getWishes: () => getFromStorage(STORAGE_KEYS.WISHES),
  saveWishes: (wishes) => saveToStorage(STORAGE_KEYS.WISHES, wishes),

  getAnnouncements: () => getFromStorage(STORAGE_KEYS.ANNOUNCEMENTS),
  saveAnnouncements: (announcements) => saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements),

  getReviews: () => getFromStorage(STORAGE_KEYS.REVIEWS),
  saveReviews: (reviews) => saveToStorage(STORAGE_KEYS.REVIEWS, reviews),

  getWaste: () => getFromStorage(STORAGE_KEYS.WASTE),
  saveWaste: (waste) => saveToStorage(STORAGE_KEYS.WASTE, waste),

  getFavorites: () => getFromStorage(STORAGE_KEYS.FAVORITES),
  saveFavorites: (favorites) => saveToStorage(STORAGE_KEYS.FAVORITES, favorites),

  init: () => {
    if (storageService.getProducts().length === 0) {
      storageService.saveProducts([
        { barcode: '111', name: 'Su', price: 5, stock: 100, category: 'İçecek', calories: 0 },
        { barcode: '222', name: 'Çikolata', price: 15, stock: 10, category: 'Yiyecek', calories: 250 },
      ]);
    }
    if (storageService.getStudents().length === 0) {
      storageService.saveStudents([
        { id: 's1', name: 'Ali', surname: 'Öğrenci', studentNo: '101', password: '123' },
      ]);
    }
    if (storageService.getStaff().length === 0) {
      storageService.saveStaff([
        { id: 't1', name: 'Ahmet', surname: 'Hoca', studentNo: 'SICIL01', email: 'ahmet@example.com', password: '123' },
      ]);
    }
    if (storageService.getCards().length === 0) {
      storageService.saveCards([
        { cardId: '999', studentId: 's1', balance: 50 },
        { cardId: '888', studentId: 't1', balance: -10 },
      ]);
    }
  }
};
