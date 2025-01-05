import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

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

  setCurrentFolderId(folderId: string | null) {
    this.currentFolderId = folderId;
  }

  getCurrentFolderId(): string | null {
    return this.currentFolderId;
  }

  updateCurrentFiles(files: FileNode[]) {
    this.currentFiles.next(files);
  }

  addFilesToQueue(files: File[], parentId: string | null = null): void {
    const items: UploadItem[] = files.map(file => ({
      path: file.name,
      type: 'file',
      status: 'pending',
      file: file
    }));
    this.uploadQueue.next([...this.uploadQueue.value, ...items]);
    this.filesUploaded.next(files);
  }

  addFolderToQueue(files: File[]): void {
    if (files.length === 0) return;

    const firstFile = files[0];
    const rootFolderPath = firstFile.webkitRelativePath.split('/')[0];

    const items: UploadItem[] = files.map(file => ({
      path: file.webkitRelativePath,
      type: 'file',
      status: 'pending',
      file: file,
      relativePath: file.webkitRelativePath
    }));

    this.uploadQueue.next([...this.uploadQueue.value, ...items]);
    this.foldersUploaded.next({
      name: rootFolderPath,
      files: files
    });
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
