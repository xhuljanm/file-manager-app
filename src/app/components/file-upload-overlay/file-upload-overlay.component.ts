import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FileUploadService, FileNode } from '../../services/file-upload.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-file-upload-overlay',
  templateUrl: './file-upload-overlay.component.html',
  styleUrls: ['./file-upload-overlay.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class FileUploadOverlayComponent {
  isDragging = false;
  selectedFiles: File[] = [];
  currentFolderId: string | null = null;
  existingFiles: string[] = [];

  constructor(private fileUploadService: FileUploadService) {
    this.currentFolderId = this.fileUploadService.getCurrentFolderId();
    this.fileUploadService.currentFiles$.subscribe((files: FileNode[]) => {
      this.existingFiles = files.map(f => f.name);
    });
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

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) {
      const fileArray = Array.from(files);
      const { hasDupes, dupeFiles } = this.hasDuplicates(fileArray);
      if (hasDupes) {
        alert(`Cannot upload duplicate files: ${dupeFiles.join(', ')}`);
        return;
      }
      this.selectedFiles = fileArray;
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const fileArray = Array.from(files);
      const { hasDupes, dupeFiles } = this.hasDuplicates(fileArray);
      if (hasDupes) {
        alert(`Cannot upload duplicate files: ${dupeFiles.join(', ')}`);
        (event.target as HTMLInputElement).value = '';
        return;
      }
      this.selectedFiles = fileArray;
    }
  }

  closeOverlay(event: MouseEvent): void {
    event.preventDefault();
    this.fileUploadService.closeFileUpload();
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'movie';
    if (file.type.startsWith('audio/')) return 'audiotrack';
    if (file.type.includes('pdf')) return 'picture_as_pdf';
    if (file.type.includes('word')) return 'description';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'table_chart';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  startUpload(): void {
    if (this.selectedFiles.length > 0) {
      const { hasDupes, dupeFiles } = this.hasDuplicates(this.selectedFiles);
      if (hasDupes) {
        alert(`Cannot upload duplicate files: ${dupeFiles.join(', ')}`);
        return;
      }
      this.fileUploadService.addFilesToQueue(this.selectedFiles, this.currentFolderId);
      this.fileUploadService.startUpload();
      this.fileUploadService.closeFileUpload();
      this.selectedFiles = [];
    }
  }

  clearSelection(): void {
    this.selectedFiles = [];
  }

  onFolderSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const fileArray = Array.from(files);
      const { hasDupes, dupeFiles } = this.hasDuplicates(fileArray);
      if (hasDupes) {
        alert(`Cannot upload duplicate files: ${dupeFiles.join(', ')}`);
        (event.target as HTMLInputElement).value = '';
        return;
      }
      this.fileUploadService.addFolderToQueue(fileArray);
      this.fileUploadService.startUpload();
      this.fileUploadService.closeFileUpload();
    }
  }
}