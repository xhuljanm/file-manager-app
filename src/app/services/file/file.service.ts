import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileNode } from '../../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:7089/api/Users/';

  constructor(private http: HttpClient) {}

  getUserFolders(userId: string): Observable<FileNode[]> {
    return this.http.get<FileNode[]>(`${this.apiUrl}${userId}`);
  }
}
