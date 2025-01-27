import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IndexedDBService } from '../indexed-db/indexed-db.service';
import { HttpClient } from '@angular/common/http';

import { UploadItem } from '../../models/file.model';
import { FileNode } from '../../models/file.model';
import { FolderUpload } from '../../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private uploadQueue = new BehaviorSubject<UploadItem[]>([]);
  uploadQueue$ = this.uploadQueue.asObservable();
  private showOverlay = new BehaviorSubject<boolean>(false);
  showOverlay$ = this.showOverlay.asObservable();
  private currentFolderId: number | null = null;
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

  constructor(
    private indexedDBService: IndexedDBService,
    private http: HttpClient
  ) {}

  // Convert File to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:*/*;base64, prefix
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  }

  setCurrentFolderId(folderId: number | null) {
    this.currentFolderId = folderId;
  }

  getCurrentFolderId(): number | null {
    return this.currentFolderId;
  }

  updateCurrentFiles(files: FileNode[]) {
    this.currentFiles.next(files);
  }

  private getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  }

  async addFilesToQueue(files: File[], parentId: number | null = null): Promise<void> {
    this.isUploading.next(true);

    try {
      const items: UploadItem[] = files.map(file => ({
        path: file.name,
        type: 'file',
        status: 'uploading',
        file: file
      }));

      this.uploadQueue.next([...this.uploadQueue.value, ...items]);

      // Upload files to the API
      const uploadPromises = files.map(async file => {
        const base64Data = await this.fileToBase64(file);
        const userId = parseInt(localStorage.getItem('user_id') || '0', 10);

        console.log(this.currentFolderId, parentId)
        const fileData = {
          name: file.name,
          fileType: this.getFileExtension(file.name),
          fileSize: file.size,
          fileData: base64Data,
          userId: userId,
          folderId: parentId
        };

        return this.http.post('https://localhost:7089/api/File', fileData).toPromise();
      });

      await Promise.all(uploadPromises);

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

      // Upload files to the API
      const uploadPromises = files.map(async file => {
        const base64Data = await this.fileToBase64(file);
        const userId = parseInt(localStorage.getItem('user_id') || '0', 10);

        const fileData = {
          id: 0,
          name: file.name,
          fileType: this.getFileExtension(file.name),
          fileSize: file.size,
          fileData: base64Data,
          userId: userId,
          folderId: this.currentFolderId ? this.currentFolderId : 0
        };

        return this.http.post('https://localhost:7089/api/File', fileData).toPromise();
      });

      await Promise.all(uploadPromises);

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
