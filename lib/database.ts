// Basit JSON dosyası tabanlı veritabanı sistemi
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIKES_FILE = path.join(DATA_DIR, 'likes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Dosya yoksa oluştur
const ensureDataFiles = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(LIKES_FILE)) {
    fs.writeFileSync(LIKES_FILE, JSON.stringify({}));
  }
  
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));
  }
};

// Dosyadan veri oku
const readJsonFile = (filePath: string) => {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return {};
  }
};

// Dosyaya veri yaz
const writeJsonFile = (filePath: string, data: any) => {
  try {
    ensureDataFiles();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// Like sistemi
export const getLikes = () => {
  return readJsonFile(LIKES_FILE);
};

export const updateLikes = (likes: any) => {
  return writeJsonFile(LIKES_FILE, likes);
};

export const getUserLikes = (userId: string) => {
  const likes = getLikes();
  return likes[userId] || {};
};

export const updateUserLike = (userId: string, bookId: string, liked: boolean) => {
  const likes = getLikes();
  if (!likes[userId]) {
    likes[userId] = {};
  }
  likes[userId][bookId] = liked;
  return updateLikes(likes);
};

// Kullanıcı sistemi
export const getUsers = () => {
  return readJsonFile(USERS_FILE);
};

export const createUser = (userId: string, userData: any) => {
  const users = getUsers();
  users[userId] = {
    id: userId,
    createdAt: new Date().toISOString(),
    ...userData
  };
  return writeJsonFile(USERS_FILE, users);
};

export const getUser = (userId: string) => {
  const users = getUsers();
  return users[userId] || null;
};
