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

export interface FileItem {
  id: number;
  name: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  userId: number;
  folderId: number;
  versions: any[];
}

export interface Folder {
  id: number;
  name: string;
  userId: number;
  parentId: number | null;
  folders: Folder[];
  files: FileItem[];
}

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
      const folderData = localStorage.getItem('userData');
      if (folderData) {
        const parsedData = JSON.parse(folderData);
        const folders: Folder[] = parsedData.folders || [];
        this.nestedDataSource.data = this.buildTree(folders);
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
}