
import { PortfolioWork } from '../types';

const DB_NAME = 'NeuralCanvasDB';
const STORE_NAME = 'works';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('数据库启动失败');
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveWorkToDB = async (work: PortfolioWork): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(work);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('保存失败');
  });
};

export const getAllWorksFromDB = async (): Promise<PortfolioWork[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      // 按创建时间倒序排序
      const works = request.result as PortfolioWork[];
      resolve(works.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject('读取失败');
  });
};

export const deleteWorkFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('删除失败');
  });
};
