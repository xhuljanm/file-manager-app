import { Component } from '@angular/core';
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
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared/shared.service';
import { FileNode } from '../../models/file.model';

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
    MatListModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  searchText: string = '';
  searchResults: any[] = [];
  showSearchResults: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private sharedService: SharedService
  ) {}

  logout(): void {
    this.authService.logout();
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

    // Flatten the folder data
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

  generateBreadcrumbs(result: any): string[] {
    return [result.name, 'Dashboard'];  // Customize breadcrumb structure as needed
  }
}