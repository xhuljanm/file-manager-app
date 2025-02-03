import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SharedService } from '../../services/shared/shared.service';
import { FileNode } from '../../models/file.model';
import { DarkModeService } from '../../services/dark-mode/dark-mode.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatListModule,
    MatSlideToggleModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() darkModeToggled = new EventEmitter<boolean>();
  searchText: string = '';
  searchResults: any[] = [];
  showSearchResults: boolean = false;
  username: string | null = null;
  isDarkMode: boolean = false;
  private tokenCheckInterval: any;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private sharedService: SharedService,
    private darkModeService: DarkModeService
  ) {}

  ngOnInit(): void {
    this.parseUsernameFromJwt();
    this.startTokenCheck();
  }

  ngOnDestroy(): void {
    if (this.tokenCheckInterval) clearInterval(this.tokenCheckInterval);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleDarkMode(event: MatSlideToggleChange): void {
    this.darkModeService.toggleDarkMode(event.checked);
  }

  parseUsernameFromJwt(): void {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      if (decoded.exp * 1000 < Date.now()) this.logout();
      else this.username = decoded.unique_name;

    } catch {
      this.logout();
    }
  }

  startTokenCheck(): void {
    this.tokenCheckInterval = setInterval(() => {
      this.parseUsernameFromJwt();
    }, 3600000); // Check every hour (in milliseconds)
  }

  onSearch(): void {
    if (this.searchText) {
      const userId = this.authService.getUserId();  // Assuming a method to get user ID
      this.http.get<any[]>(`https://localhost:7089/api/Folder/Search/${this.searchText}/${userId}`)
        .subscribe(results => {
          this.searchResults = results;
          this.showSearchResults = true;
        });
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  onSearchResultClick(result: any): void {
    const folderData = Array.isArray(result) ? result : [result];
    const flattenedFolderData = this.flattenFolderData(folderData);

    this.sharedService.triggerUpdateView(flattenedFolderData);

    this.searchText = '';
    this.searchResults = [];
  }

  flattenFolderData(folders: any[]): FileNode[] {
    let result: FileNode[] = [];

    folders.forEach(folder => {
      const fileNodes: FileNode[] = folder.files.map((file: { id: any; name: any; fileSize: any; }) => ({
        id: file.id,
        name: file.name,
        type: 'file',
        size: file.fileSize,
        children: [] // files have no children
      }));

      const folderNode: FileNode = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        children: fileNodes // Attach files to the folder as children
      };

      result.push(folderNode);
    });

    return result;
  }
}