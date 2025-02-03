import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private darkModeSubject = new Subject<boolean>();
  darkMode$ = this.darkModeSubject.asObservable();

  toggleDarkMode(isDarkMode: boolean): void {
    this.darkModeSubject.next(isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}