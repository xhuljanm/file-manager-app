import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

interface FileData {
  id: number;
  fileName: string;
  fileSize: number;
  content: string;  // Base64 encoded content
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private updateViewSubject = new BehaviorSubject<any[]>([]);
  private fileContentSource = new BehaviorSubject<FileData | null>(null);

  fileContent$ = this.fileContentSource.asObservable();
  updateView$ = this.updateViewSubject.asObservable();

  triggerPreview(fileData: FileData): void {
    this.fileContentSource.next(fileData);
  }

  // Trigger update view with the folder data
  triggerUpdateView(folder: any) {
    this.updateViewSubject.next(folder);
  }
}