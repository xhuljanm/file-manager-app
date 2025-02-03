import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private updateViewSubject = new BehaviorSubject<any[]>([]);
  private fileContentSource = new Subject<string>(); // Observable for file content

  fileContent$ = this.fileContentSource.asObservable();
  updateView$ = this.updateViewSubject.asObservable();

  triggerPreview(content: string): void {
    this.fileContentSource.next(content) // Trigger the content to be sent
  }

  // Trigger update view with the folder data
  triggerUpdateView(folder: any) {
    this.updateViewSubject.next(folder);
  }
}