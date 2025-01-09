import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IndexedDBService } from '../indexed-db/indexed-db.service';

interface UploadItem {
  path: string;
  type: 'file' | 'folder';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
  file?: File;
  isFolder?: boolean;
  relativePath?: string;
}

export interface FileNode {
  name: string;
  type: 'folder' | 'file';
  size?: number;
}

export interface FolderUpload {
  name: string;
  files: File[];
  totalSize: number;
  fileCount: number;
}


@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private uploadQueue = new BehaviorSubject<UploadItem[]>([]);
  uploadQueue$ = this.uploadQueue.asObservable();
  private showOverlay = new BehaviorSubject<boolean>(false);
  showOverlay$ = this.showOverlay.asObservable();
  private currentFolderId: string | null = null;
  private currentFiles = new BehaviorSubject<FileNode[]>([]);
  currentFiles$ = this.currentFiles.asObservable();

  private filesUploaded = new Subject<File[]>();
  filesUploaded$ = this.filesUploaded.asObservable();

  private foldersUploaded = new Subject<{name: string, files: File[]}>();
  foldersUploaded$ = this.foldersUploaded.asObservable();

  private folderUploads = new Subject<FolderUpload>();
  folderUploads$ = this.folderUploads.asObservable();

  private isUploading = new BehaviorSubject<boolean>(false);
  isUploading$ = this.isUploading.asObservable();

  constructor(private indexedDBService: IndexedDBService) {}

  setCurrentFolderId(folderId: string | null) {
    this.currentFolderId = folderId;
  }

  getCurrentFolderId(): string | null {
    return this.currentFolderId;
  }

  updateCurrentFiles(files: FileNode[]) {
    this.currentFiles.next(files);
  }

  async addFilesToQueue(files: File[], parentId: string | null = null): Promise<void> {
    this.isUploading.next(true);

    try {
      const items: UploadItem[] = files.map(file => ({
        path: file.name,
        type: 'file',
        status: 'uploading',
        file: file
      }));

      this.uploadQueue.next([...this.uploadQueue.value, ...items]);

      const completedItems = items.map(item => ({
        ...item,
        status: 'completed' as const
      }));
      this.uploadQueue.next(completedItems);

      this.filesUploaded.next(files);
    } catch (error) {
      console.error('Upload failed:', error);
      const failedItems = this.uploadQueue.value.map(item => ({
        ...item,
        status: 'error' as const,
        error: 'Upload failed'
      }));
      this.uploadQueue.next(failedItems);
    } finally {
      this.isUploading.next(false);
      setTimeout(() => this.clearQueue(), 2000);
    }
  }

  async addFolderToQueue(files: File[]): Promise<void> {
    if (files.length === 0) return;

    this.isUploading.next(true);

    try {
      const firstFile = files[0];
      const rootFolderPath = firstFile.webkitRelativePath.split('/')[0];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      const items: UploadItem[] = files.map(file => ({
        path: file.webkitRelativePath,
        type: 'file',
        status: 'uploading',
        file: file,
        relativePath: file.webkitRelativePath,
        size: file.size
      }));

      this.uploadQueue.next([...this.uploadQueue.value, ...items]);

      const completedItems = items.map(item => ({
        ...item,
        status: 'completed' as const
      }));
      this.uploadQueue.next(completedItems);

      this.folderUploads.next({
        name: rootFolderPath,
        files: files,
        totalSize: totalSize,
        fileCount: files.length
      });
    } catch (error) {
      console.error('Folder upload failed:', error);
      const failedItems = this.uploadQueue.value.map(item => ({
        ...item,
        status: 'error' as const,
        error: 'Upload failed'
      }));
      this.uploadQueue.next(failedItems);
    } finally {
      this.isUploading.next(false);
      setTimeout(() => this.clearQueue(), 2000);
    }
  }

  startUpload(): void {
    const currentQueue = this.uploadQueue.value;

    const uploadedFiles = currentQueue
      .filter(item => item.file && !item.relativePath)
      .map(item => item.file!);

    if (uploadedFiles.length > 0) {
      this.filesUploaded.next(uploadedFiles);
    }

    this.uploadQueue.next([]);
  }

  removeFromQueue(index: number): void {
    const queue = [...this.uploadQueue.value];
    queue.splice(index, 1);
    this.uploadQueue.next(queue);
  }

  clearQueue(): void {
    this.uploadQueue.next([]);
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFilesToQueue(Array.from(files));
    }
  }

  openFileUpload(): void {
    this.showOverlay.next(true);
  }

  closeFileUpload(): void {
    this.showOverlay.next(false);
  }
}
