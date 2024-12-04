import { Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-drag-drop-upload',
  imports: [MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './drag-drop-upload.component.html',
  styleUrls: ['./drag-drop-upload.component.scss'],
})
export class DragDropUploadComponent {
  isDragging = false;
  isFileHovered = false;
  fileInfo: { name: string; size: string } | null = null;
  uploadMode: 'file' | 'folder';

  constructor(
    public dialogRef: MatDialogRef<DragDropUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { uploadMode: 'file' | 'folder' }
  ) {
    this.uploadMode = data.uploadMode;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  setUploadMode(mode: 'file' | 'folder'): void {
    this.uploadMode = mode;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.isFileHovered = Array.from(event.dataTransfer?.items || []).some(item => item.kind === 'file');
  }

  onDragLeave(): void {
    this.isDragging = false;
    this.isFileHovered = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    this.isFileHovered = false;

    const items = Array.from(event.dataTransfer?.items || []);
    const files = Array.from(event.dataTransfer?.files || []);
    const subfolders: string[] = [];

    if (this.uploadMode === 'folder') this.processFolderUpload(items, subfolders);
    else this.processFiles(files);
  }

  // Unified folder processing
  private processFolderUpload(items: DataTransferItem[], subfolders: string[]): void {
    const folderFiles: File[] = [];
    let processedItems = 0;

    items.forEach(item => {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry?.isDirectory) {
          this.traverseDirectory(entry as FileSystemDirectoryEntry, folderFiles, subfolders, () => {
            processedItems++;
            if (processedItems === items.length) this.updateFileInfo(folderFiles, subfolders);
          });
        }
      }
    });
  }

  // Directory traversal
  private traverseDirectory(directory: FileSystemDirectoryEntry, files: File[], subfolders: string[], callback: () => void): void {
    const reader = directory.createReader();
    reader.readEntries(entries => {
      const entriesProcessed = entries.length;
      let processedCount = 0;

      if (entries.length === 0) {
        callback();
        return;
      }

      entries.forEach(entry => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file(file => {
            files.push(file);
            processedCount++;
            if (processedCount === entriesProcessed) callback();
          });
        } else if (entry.isDirectory) {
          subfolders.push(entry.fullPath);
          this.traverseDirectory(entry as FileSystemDirectoryEntry, files, subfolders, () => {
            processedCount++;
            if (processedCount === entriesProcessed) callback();
          });
        }
      });
    });
  }

  private processFiles(files: File[]): void { // Unified file processing
    this.readFilesAsBuffers(files, (fileObjects) => this.updateFileInfo(files));
  }

  private readFilesAsBuffers(files: File[], callback: (fileObjects: any[]) => void): void {
    const fileObjects: any[] = [];
    let processedFiles = 0;

    files.forEach(file => {
      const reader = new FileReader();

      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const fileObject = {
          name: file.name,
          size: file.size,
          buffer: buffer,
        };

        fileObjects.push(fileObject);
        processedFiles++;

        if (processedFiles === files.length) callback(fileObjects);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Updates file information display
  private updateFileInfo(files: File[], subfolders: string[] = []): void {
    if (files.length === 0 && subfolders.length === 0) {
      this.fileInfo = null;
      return;
    }

    const totalSize = files.reduce((total, file) => total + file.size, 0);

    // If uploading a folder
    if (this.uploadMode === 'folder') {
      const folderName = files.length > 0 ? files[0].webkitRelativePath.split('/')[0] : 'Folder';
      const fileCount = files.length;
      const subfolderCount = subfolders.length;

      // Display the folder name, file count and subfolder count
      this.fileInfo = {
        name: `${folderName} (${fileCount} files, ${subfolderCount} subfolders)`,
        size: this.formatFileSize(totalSize),
      };
    } else {
      const fileNames = files.map(file => file.name).join(', ');
      this.fileInfo = {
        name: `${fileNames}`,
        size: this.formatFileSize(totalSize),
      };
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    const folderStructure: { [key: string]: any } = {};
    let subfolders: string[] = [];

    if (files.length === 0) {
      this.fileInfo = null;
      return;
    }

    if (this.uploadMode === 'folder') {
      files.forEach(file => {
        const relativePath = file.webkitRelativePath;
        const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'));

        if (folderPath) {
          const pathParts = folderPath.split('/');
          let currentFolder = folderStructure;

          pathParts.forEach((part, index) => {
            if (!currentFolder[part]) currentFolder[part] = index === pathParts.length - 1 ? [] : {};
            currentFolder = currentFolder[part];
          });

          const fileDetails = { name: file.name, size: file.size };
          currentFolder['push'](fileDetails);

          if (!subfolders.includes(folderPath)) subfolders.push(folderPath);
        }
      });

      // Process files inside folders (with buffer)
      this.readFilesAsBuffers(files, (fileObjects) => {
        console.log('Files with Buffers:', fileObjects);
      });

      console.log('Folder Structure:', folderStructure);
      console.log('Subfolders:', subfolders);
    } else {
      this.processFiles(files);
    }

    this.updateFileInfo(files, subfolders);
  }

  formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }
}