import { Component, ViewChild } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule, MatMenu } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { FileUploadService } from '../../services/file-upload.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { FileUploadOverlayComponent } from '../../components/file-upload-overlay/file-upload-overlay.component';

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  size?: number;
  buffer?: ArrayBuffer;
  children?: FileNode[];
  loaded?: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatListModule,
    FileUploadOverlayComponent
  ]
})
export class DashboardComponent {
  currentFolder: FileNode[] = [];
  navigationStack: FileNode[][] = [];
  dataSource = new MatTreeNestedDataSource<FileNode>();
  treeControl = new NestedTreeControl<FileNode>(node => node.children);
  @ViewChild('newMenu') newMenu!: MatMenu;
  selectedNode: FileNode | null = null;
  showUploadSection = false;
  isDragging = false;

  constructor(
    public uploadService: FileUploadService,
    private fileUploadService: FileUploadService
  ) {
    // init with test data
    const ROOT_DATA: FileNode[] = Array.from({ length: 20 }, (_, i) => ({
      name: `Test Folder ${i + 1}`,
      type: 'folder',
      children: [
        { name: `document${i + 1}.pdf`, type: 'file', size: 150000 },
        { name: `image${i + 1}.jpg`, type: 'file', size: 250000 }
      ]
    }));

    this.currentFolder = ROOT_DATA;
    this.updateView();

    // handle file uploads
    this.fileUploadService.filesUploaded$.subscribe(files => {
      files.forEach(file => {
        const newFile: FileNode = {
          name: file.name,
          type: 'file',
          size: file.size
        };
        this.currentFolder.push(newFile);
      });
      this.updateView();
    });

    // handle folder uploads
    this.fileUploadService.foldersUploaded$.subscribe(({name, files}) => {
      const folderStructure: { [key: string]: FileNode } = {};

      const rootFolder: FileNode = {
        name: name,
        type: 'folder',
        children: []
      };

      files.forEach(file => {
        const pathParts = file.webkitRelativePath.split('/');
        let currentLevel = rootFolder.children!;

        // skip root folder name
        for (let i = 1; i < pathParts.length; i++) {
          const part = pathParts[i];

          if (i === pathParts.length - 1) {
            currentLevel.push({
              name: part,
              type: 'file',
              size: file.size
            });
          } else {
            let folder = currentLevel.find(node => node.name === part && node.type === 'folder');
            if (!folder) {
              folder = {
                name: part,
                type: 'folder',
                children: []
              };
              currentLevel.push(folder);
            }
            currentLevel = folder.children!;
          }
        }
      });

      this.currentFolder.push(rootFolder);
      this.updateView();
    });
  }

  onFolderClick(node: FileNode): void {
    this.selectedNode = node;
  }

  onFolderDoubleClick(node: FileNode): void {
    if (node.type === 'folder') {
      this.navigationStack.push(this.currentFolder);
      this.currentFolder = node.children || [];
      this.updateView();
      this.selectedNode = null;
    }
  }

  canModify(): boolean {
    return this.selectedNode !== null;
  }

  goBack(): void {
    if (this.navigationStack.length > 0) {
      this.currentFolder = this.navigationStack.pop()!;
      this.updateView();
    }
  }

  canGoBack(): boolean {
    return this.navigationStack.length > 0;
  }

  private updateView(): void {
    this.dataSource.data = [...this.currentFolder];
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  onFileClick(node: FileNode): void {
    this.selectedNode = node;
  }

  hasChild = (_: number, node: FileNode): boolean => node.type === 'folder';

  createNewFolder(): void {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      // check for duplicates in current folder
      const folderExists = this.currentFolder.some(
        item => item.type === 'folder' && item.name === folderName
      );

      if (folderExists) {
        alert('A folder with this name already exists!');
        return;
      }

      const newFolder: FileNode = {
        name: folderName,
        type: 'folder',
        children: []
      };
      this.currentFolder.push(newFolder);
      this.updateView();
    }
  }

  createNewFile(): void {
    const fileName = prompt('Enter file name with extension (e.g., file.txt):');
    if (fileName) {
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex === -1) {
        alert('Please include a file extension (e.g., .txt, .pdf)');
        return;
      }

      // check for duplicates in current folder
      const fileExists = this.currentFolder.some(item => item.type === 'file' && item.name === fileName);

      if (fileExists) {
        alert('A file with this name and extension already exists!');
        return;
      }

      const newFile: FileNode = {
        name: fileName,
        type: 'file',
        size: 0
      };
      this.currentFolder.push(newFile);
      this.updateView();
    }
  }

  rename(): void {
    if (this.selectedNode) {
      if (this.selectedNode.type === 'file') {
        const lastDotIndex = this.selectedNode.name.lastIndexOf('.');
        const currentName = lastDotIndex !== -1 ? this.selectedNode.name.slice(0, lastDotIndex) : this.selectedNode.name;
        const extension = lastDotIndex !== -1 ? this.selectedNode.name.slice(lastDotIndex) : '';

        const newName = prompt('Enter new name:', currentName);
        if (newName && newName !== currentName) {
          this.selectedNode.name = newName + extension;
          this.updateView();
        }
      } else {
        const newName = prompt('Enter new name:', this.selectedNode.name);
        if (newName && newName !== this.selectedNode.name) {
          this.selectedNode.name = newName;
          this.updateView();
        }
      }
    }
  }

  delete(): void {
    if (this.selectedNode) {
      const confirmDelete = confirm(`Are you sure you want to delete "${this.selectedNode.name}"?`);
      if (confirmDelete) {
        const index = this.currentFolder.indexOf(this.selectedNode);
        if (index > -1) {
          this.currentFolder.splice(index, 1);
          this.selectedNode = null;
          this.updateView();
        }
      }
    }
  }

  onFileInput(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.uploadService.addFilesToQueue(Array.from(files));
    }
  }

  onFolderInput(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.uploadService.addFolderToQueue(Array.from(files));
    }
  }

  startUpload(): void {
    this.uploadService.startUpload();
  }

  toggleUploadSection(): void {
    this.showUploadSection = !this.showUploadSection;
  }

  openFileUpload(): void {
    this.fileUploadService.openFileUpload();
  }

  onFolderOpen(folderId: string) {
    this.fileUploadService.setCurrentFolderId(folderId);
  }
}
