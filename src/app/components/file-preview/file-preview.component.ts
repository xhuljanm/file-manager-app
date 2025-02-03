import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared/shared.service';
import { CommonModule } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ]
})
export class FilePreviewComponent implements OnInit {
  preview: string = '';
  isVisible: boolean = false;
  fileName: string = '';
  fileSize: number = 0;
  fileId: number = 0;
  isEditMode: boolean = false;

  constructor(private sharedService: SharedService, private http: HttpClient) {}

  ngOnInit(): void {
    this.sharedService.fileContent$.subscribe(fileData => {
      console.log('Received File Data:', fileData);
      if (fileData) {
        this.preview = atob(fileData.content.trim()); // Decode base64 content
        this.fileName = fileData.fileName;
        this.fileSize = fileData.fileSize;
        this.fileId = fileData.id;
        this.isVisible = true;
      }
    });
  }

  closePreview(): void {
    this.isVisible = false;
  }

  enableEdit(): void {
    this.isEditMode = true;
  }

  saveEdit(): void {
    const updatedFileData = {
      id: this.fileId,
      name: this.fileName,
      fileType: 'text',
      fileSize: this.preview.length,
      fileData: btoa(this.preview)
    };

    this.http.post('https://localhost:7089/api/File/UpdateFile', updatedFileData, {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/json'
      })
    }).subscribe(
      (response) => {
        console.log('File updated successfully', response);
        this.isEditMode = false;
      },
      (error) => {
        console.error('Error updating file', error);
        alert('Error updating file');
      }
    );
  }

}