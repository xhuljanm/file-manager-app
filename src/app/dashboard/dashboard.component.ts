import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';

import { SearchbarComponent } from "../components/searchbar/searchbar.component";
import { DragDropUploadComponent } from '../components/drag-drop-upload/drag-drop-upload.component';

import { FileUploadService } from '../manager/services/file-upload.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatToolbarModule, SearchbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
	title: string = 'Dashboard';
	file: File | null = null;
  fileBuffer: ArrayBuffer | null = null;
  fileInfo: { name: string; extension: string; size: string } | null = null;
  progress: number = 0;
  private apiUrl: string = 'http://localhost:3000/api/upload';

  constructor(private fileUploadService: FileUploadService, private http: HttpClient, private dialog: MatDialog) {}

  onFileSelected(event: any): void {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;

      // Use FileReader to read file as buffer
      const reader = new FileReader();
      reader.onload = () => {
        this.fileBuffer = reader.result as ArrayBuffer;

        // Extract file details
        const fileSizeKB = (selectedFile.size / 1024).toFixed(2);
        const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
        const extension = selectedFile.name.split('.').pop() || '';

        this.fileInfo = {
          name: selectedFile.name,
          extension: extension,
          size: fileSizeMB + ' MB', // Optionally use `fileSizeKB + ' KB'`
        };

        console.log('File Info:', this.fileInfo);
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsArrayBuffer(selectedFile); // Convert file to buffer
    }
  }

  uploadFile(payload: { buffer: ArrayBuffer; info: { name: string; extension: string; size: string } }): Observable<any> {
    // Send the payload with the buffer and info
    return this.http.post(this.apiUrl, payload, {
      reportProgress: true,
      observe: 'events',
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }

  openUploadDialog(mode: 'file' | 'folder'): void {
    this.dialog.open(DragDropUploadComponent, {
      width: '500px',
      height: '450px',
      panelClass: 'upload-dialog',
      data: { uploadMode: mode } // Pass the mode here
    });
  }
}