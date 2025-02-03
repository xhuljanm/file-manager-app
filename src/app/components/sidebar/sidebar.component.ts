import { Component, Input, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { FileNode } from '../../models/file.model';
import { SharedService } from '../../services/shared/shared.service';
import { FileItem, Folder } from '../../models/file.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatRippleModule,
    MatTooltipModule,
    MatTreeModule
  ]
})
export class SidebarComponent implements OnInit {
  isExpanded = true;
  nestedTreeControl = new NestedTreeControl<FileNode>(node => node.children);
  nestedDataSource = new MatTreeNestedDataSource<FileNode>();

  menuItems = [
    { icon: 'folder', text: 'My Files', tooltip: 'My Files', routerLink: '/dashboard' },
    { icon: 'star', text: 'Starred', tooltip: 'Starred', routerLink: '/starred' },
    { icon: 'delete', text: 'Trash', tooltip: 'Trash', routerLink: '/trash' }
  ];

  constructor(private sharedService: SharedService) {}

  hasChild = (_: number, node: FileNode) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
    try {
      const folderData = localStorage.getItem('userData') as string;
      console.log(folderData);
      if (folderData) {
        const parsedData = JSON.parse(folderData);
        const folders: Folder[] = parsedData.folders || [];
        this.nestedDataSource.data = this.buildTree(folders);
        console.log(parsedData, 'parsedData');
      }
    } catch (error) {
      console.error('Error parsing folderData:', error);
      this.nestedDataSource.data = [];
    }
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  buildTree(folders: Folder[]): FileNode[] {
    return folders.map(folder => {
      const children: FileNode[] = [
        ...this.buildTree(folder.folders),
        ...folder.files.map(file => ({ name: file.name, type: 'file' } as FileNode))
      ];
      return { name: folder.name, type: 'folder', children } as FileNode;
    });
  }

  openFilePreview(node: FileNode): void {
    if (node.type === 'file') {
      const fileData = this.findFileContent(node.name);
      console.log('Found File Content:', fileData);
      if (fileData) {
        this.sharedService.triggerPreview({
          id: fileData.id,
          fileName: fileData.name,
          fileSize: fileData.fileSize,
          content: fileData.fileData
        });
      } else {
        console.warn('File content not found.');
      }
    }
  }

  private findFileContent(fileName: string): FileItem | null {
    const folderData = localStorage.getItem('userData');
    if (folderData) {
      const parsedData = JSON.parse(folderData);
      const file = this.findFile(parsedData.folders, fileName);
      return file ? file : null;
    }
    return null;
  }

  private findFile(folders: Folder[], fileName: string): FileItem | null {
    for (const folder of folders) {
      const file = folder.files.find(f => f.name === fileName);
      if (file) return file;
      const subFolderFile = this.findFile(folder.folders, fileName);
      if (subFolderFile) return subFolderFile;
    }
    return null;
  }
}