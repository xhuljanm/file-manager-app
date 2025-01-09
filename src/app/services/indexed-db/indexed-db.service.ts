import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map } from 'rxjs';

interface DBFile {
  id?: number;
  name: string;
  type: string;
  data: Blob;
  path?: string;
  timestamp: number;
  uploaded: boolean;
  size: number;
}

interface FileData {
  name: string;
  fileType: string;
  fileSize: number;
  fileData: ArrayBuffer;
  userId: number;
  folderId?: number;
}

interface FolderData {
  name: string;
  userId: number;
  parentId: number | null;
  folders: FolderData[];
  files: FileData[];
}

interface UserData {
  username: string;
  folders: FolderData[];
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private readonly DB_NAME = 'FileUploadDB';
  private readonly STORE_NAME = 'files';
  private readonly DB_VERSION = 1;
  private db!: IDBDatabase;

  private uploadProgress = new BehaviorSubject<number>(0);
  uploadProgress$ = this.uploadProgress.asObservable();

  private isUploading = new BehaviorSubject<boolean>(false);
  isUploading$ = this.isUploading.asObservable();

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };
    });
  }

  async saveFilesToIndexedDB(files: File[]): Promise<void> {
    this.isUploading.next(true);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    let processedSize = 0;

    try {
      const structure: UserData = {
        username: 'default_user',
        folders: []
      };

      const rootFolder: FolderData = {
        name: 'root',
        userId: 1,
        parentId: null,
        folders: [],
        files: []
      };

      for (const file of files) {
        const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];

        if (pathParts.length === 1) {
          const fileData = await this.createFileData(file);
          rootFolder.files.push(fileData);
        } else {
          let currentFolder = rootFolder;

          for (let i = 0; i < pathParts.length - 1; i++) {
            const folderName = pathParts[i];

            if (i === 0 && folderName === rootFolder.name) continue;

            //find or create folder
            let folder = currentFolder.folders.find(f => f.name === folderName);
            if (!folder) {
              folder = {
                name: folderName,
                userId: 1,
                //convert string to number for parentId if needed
                parentId: currentFolder === rootFolder ? null : (typeof currentFolder.name === 'string' ? parseInt(currentFolder.name) : null),
                folders: [],
                files: []
              };
              currentFolder.folders.push(folder);
            }
            // add type assertion or null check
            if (folder) currentFolder = folder;
          }

          const fileData = await this.createFileData(file);
          currentFolder.files.push(fileData);
        }

        processedSize += file.size;
        const progress = (processedSize / totalSize) * 100;
        this.uploadProgress.next(Math.round(progress));
      }

      structure.folders.push(rootFolder);

      this.uploadProgress.next(95);
      await this.saveStructureToDB(structure);

      this.uploadProgress.next(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Files saved successfully:', structure);

    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
      throw error;
    } finally {
      this.isUploading.next(false);
    }
  }

  private async createFileData(file: File): Promise<FileData> {
    const arrayBuffer = await file.arrayBuffer();
    return {
      name: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: arrayBuffer,
      userId: 1, // will be replaced with actual user ID later
    };
  }

  private async saveStructureToDB(structure: UserData): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(structure);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  clearDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('IndexedDB cleared successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  getUnuploadedFiles(): Observable<DBFile[]> {
    return from(new Promise<DBFile[]>((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result.filter(file => !file.uploaded);
        resolve(files);
      };

      request.onerror = () => reject(request.error);
    }));
  }

  markFileAsUploaded(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const file = request.result;
        file.uploaded = true;
        store.put(file);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }
}
