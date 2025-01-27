import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { animate, style, transition, trigger } from '@angular/animations';
import { FileUploadService } from '../../services/file-upload/file-upload.service';
import { IndexedDBService } from '../../services/indexed-db/indexed-db.service';
import { FileNode } from '../../models/file.model';
import { FileUtils } from '../../utils/file.utils';

@Component({
  selector: 'app-file-upload-overlay',
  templateUrl: './file-upload-overlay.component.html',
  styleUrls: ['./file-upload-overlay.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [ style({ opacity: 0 }), animate('150ms', style({ opacity: 1 })) ]),
      transition(':leave', [ animate('150ms', style({ opacity: 0 })) ])
    ])
  ]
})
export class FileUploadOverlayComponent {
  isDragging = false;
  isFileUpload = false;
  isFolderUpload = false;
  selectedFiles: File[] = [];
  currentFolderId: number | null = null;
  existingFiles: string[] = [];
  folderInfo: {
    name: string;
    totalSize: number;
    fileCount: number;
  } | null = null;

  constructor(private fileUploadService: FileUploadService, public indexedDBService: IndexedDBService) {
    this.currentFolderId = this.fileUploadService.getCurrentFolderId();
    this.fileUploadService.currentFiles$.subscribe((files: FileNode[]) => {
      this.existingFiles = files.map(f => f.name);
    });

    this.fileUploadService.folderUploads$.subscribe(folderUpload => {
      this.folderInfo = {
        name: folderUpload.name,
        totalSize: folderUpload.totalSize,
        fileCount: folderUpload.fileCount
      };
    });

  }

  private async handleFileUpload(files: File[], isFolder: boolean = false): Promise<void> {
    try {
      const { hasDupes, dupeFiles } = this.hasDuplicates(files);
      if (hasDupes) {
        alert(`Cannot upload duplicate files: ${dupeFiles.join(', ')}`);
        return;
      }

      if (isFolder && files.length > 0) {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const folderName = files[0].webkitRelativePath.split('/')[0];

        this.folderInfo = {
          name: folderName,
          totalSize: totalSize,
          fileCount: files.length
        };
      }

      await this.indexedDBService.saveFilesToIndexedDB(files);
      this.selectedFiles = files;

    } catch (error) {
      console.error('Error processing files:', error);
      alert('Failed to process files. Please try again.');
    }
  }

  private hasDuplicates(files: File[]): { hasDupes: boolean; dupeFiles: string[] } {
    const dupeFiles: string[] = [];
    files.forEach(file => {
      if (this.existingFiles.includes(file.name)) {
        dupeFiles.push(file.name);
      }
    });
    return { hasDupes: dupeFiles.length > 0, dupeFiles };
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging = false;
    this.clearSelection();

    const items = event.dataTransfer?.items;
    if (!items) return;

    try {
      let fileArray: File[] = [];
      let isFolder = false;

      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              const file = item.getAsFile();
              if (file) fileArray.push(file);
            } else if (entry.isDirectory) {
              isFolder = true;
              const { files, totalSize } = await this.readFolderContents(entry as FileSystemDirectoryEntry);
              fileArray = fileArray.concat(files);
            }
          }
        }
      }

      await this.handleFileUpload(fileArray, isFolder);

    } catch (error) {
      console.error('Error processing dropped items:', error);
      alert('Failed to process dropped items. Please try again.');
    }
  }

  private async readFolderContents(folder: FileSystemDirectoryEntry): Promise<{
    files: File[];
    totalSize: number;
  }> {
    const files: File[] = [];
    let totalSize = 0;

    const readEntry = async (entry: FileSystemEntry, path: string = ''): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await this.getFileFromEntry(fileEntry);
        if (file) {
          files.push(file);
          totalSize += file.size;
        }
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        const newPath = path ? `${path}/${entry.name}` : entry.name;
        await this.readDirectoryEntries(dirReader, newPath, readEntry);
      }
    };

    await readEntry(folder);
    return { files, totalSize };
  }

  private async readDirectoryEntries(
    dirReader: FileSystemDirectoryReader,
    path: string,
    callback: (entry: FileSystemEntry, path: string) => Promise<void>
  ): Promise<void> {
    return new Promise((resolve) => {
      const readEntries = () => {
        dirReader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
          } else {
            await Promise.all(entries.map(entry => callback(entry, path)));
            readEntries();
          }
        });
      };
      readEntries();
    });
  }

  private getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve) => {
      fileEntry.file((file) => {
        resolve(file);
      });
    });
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    event.stopPropagation(); // Prevent event bubbling
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const fileArray = Array.from(files);
      await this.handleFileUpload(fileArray, false);
    }
    (event.target as HTMLInputElement).value = ''; // Clear the input
  }

  async onFolderSelected(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const fileArray = Array.from(files);
      await this.handleFileUpload(fileArray, true);
    }
    (event.target as HTMLInputElement).value = '';
  }

  closeOverlay(event: MouseEvent): void {
    event.preventDefault();
    this.fileUploadService.closeFileUpload();
  }

  formatFileSize(bytes: number): string {
    return FileUtils.formatFileSize(bytes);
  }

  getFileIcon(file: File): string {
    return FileUtils.getFileIcon(file);
  }

  get hasUploads(): boolean {
    return this.selectedFiles.length > 0;
  }

  getTotalSize(): number {
    return this.selectedFiles.reduce((total, file) => total + file.size, 0);
  }

  async startUpload(): Promise<void> {
    if (this.selectedFiles.length === 0) return;

    try {
      const { hasDupes, dupeFiles } = this.hasDuplicates(this.selectedFiles);
      if (hasDupes) {
        alert(`Cannot upload duplicate files: ${dupeFiles.join(', ')}`);
        return;
      }

      if (this.folderInfo) {
        await this.fileUploadService.addFolderToQueue(this.selectedFiles);
      } else {
        await this.fileUploadService.addFilesToQueue(this.selectedFiles, this.currentFolderId);
      }

      this.fileUploadService.startUpload();
      this.fileUploadService.closeFileUpload();
      await this.clearSelection();

    } catch (error) {
      console.error('Error during upload:', error);
      alert('Failed to upload files. Please try again.');
    }
  }

  async clearSelection(): Promise<void> {
    try {
      await this.indexedDBService.clearDatabase();
      this.selectedFiles = [];
      this.folderInfo = null;
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const folderInput = document.querySelector('input[webkitdirectory]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      if (folderInput) folderInput.value = '';
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing uploaded files. Please try again.');
    }
  }
}