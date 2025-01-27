import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private updateViewSubject = new BehaviorSubject<any[]>([]);

  updateView$ = this.updateViewSubject.asObservable();

  // Trigger update view with the folder data
  triggerUpdateView(folder: any) {
    this.updateViewSubject.next(folder);
  }
}