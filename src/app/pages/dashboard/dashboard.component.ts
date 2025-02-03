import { Component, ViewChild, HostListener, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { MatTreeNestedDataSource } from '@angular/material/tree';
import { CdkTree, CdkTreeNode, NestedTreeControl } from '@angular/cdk/tree';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule, MatMenu } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FileUploadOverlayComponent } from '../../components/file-upload-overlay/file-upload-overlay.component';
import { FileUploadService } from '../../services/file-upload/file-upload.service';

import { FileUtils } from '../../utils/file.utils';
import { FileNode } from '../../models/file.model';
import { Breadcrumb } from '../../models/breadcrumb.model';
import { FileItem, Folder } from '../../models/file.model';
import { SharedService } from '../../services/shared/shared.service';
import { FilePreviewComponent } from "../../components/file-preview/file-preview.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CdkTree,
    CdkTreeNode,
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
    DragDropModule,
    MatCheckboxModule,
    FileUploadOverlayComponent,
    FilePreviewComponent
]
})
export class DashboardComponent implements OnInit {
  currentFolder: FileNode[] = [];
  selectedNodes: Set<FileNode> = new Set();
  isMultiSelectMode: boolean = false;
  navigationStack: FileNode[][] = [];
  breadcrumbs: Breadcrumb[] = [];
  dataSource = new MatTreeNestedDataSource<FileNode>();
  treeControl = new NestedTreeControl<FileNode>(node => node.children);
  @ViewChild('newMenu') newMenu!: MatMenu;
  selectedNode: FileNode | null = null;
  showUploadSection = false;
  isDragging = false;
  @Input() isDarkMode: boolean = false;
  isFilePreviewVisible: boolean = false;

  constructor(public uploadService: FileUploadService, private fileUploadService: FileUploadService, private http: HttpClient, private sharedService: SharedService) {
    this.currentFolder = [];
    this.updateView();

    //handle file uploads
    this.uploadService.filesUploaded$.subscribe(files => {
      files.forEach(file => {
        // prevent adding the same file if it already exists
        const fileExists = this.currentFolder.some(f => f.name === file.name);
        if (!fileExists) {
          const newFile: FileNode = { name: file.name, type: 'file', size: file.size };
          this.currentFolder.push(newFile);
        }
      });
      this.updateView();
    });

    //handle folder uploads
    this.uploadService.foldersUploaded$.subscribe(({name, files}) => {
      const rootFolder: FileNode = {
        name: name,
        type: 'folder',
        children: []
      };

      files.forEach(file => {
        const pathParts = file.webkitRelativePath.split('/');
        let currentLevel = rootFolder.children!;

        //skip root folder name
        for (let i = 1; i < pathParts.length; i++) {
          const part = pathParts[i];

          if (i === pathParts.length - 1) {
            currentLevel.push({ name: part, type: 'file', size: file.size });
          } else {
            let folder = currentLevel.find(node => node.name === part && node.type === 'folder');
            if (!folder) {
              folder = { name: part, type: 'folder', children: [] };
              currentLevel.push(folder);
            }

            currentLevel = folder.children!;
          }
        }
      });

      this.currentFolder.push(rootFolder);
      this.updateView();
    });

    this.sharedService.updateView$.subscribe((folders) => {
      this.currentFolder = folders;
      this.updateView();
    });

    this.breadcrumbs = [{
      name: 'My Drive',
      node: this.currentFolder,
      index: 0
    }];
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      this.fetchUserData(parseInt(userId, 10));
    } else {
      console.error('User ID is not found in localStorage');
    }

    this.sharedService.fileContent$.subscribe((data) => {
      console.log(data, !!data);
      this.isFilePreviewVisible = !!data;
    });
  }

  openFilePreview(node: FileNode): void {
    if (node.type === 'file') {
      const fileData = this.findFileContent(node.name);
      console.log('Found File Content:', fileData);
      if (fileData) {
        // Pass the full fileData object instead of just the file content string
        this.sharedService.triggerPreview({
          id: fileData.id,
          fileName: fileData.name,
          fileSize: fileData.fileSize,
          content: fileData.fileData // This is the actual file content
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
        return file ? file : null; // Return the full file object
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

  fetchUserData(userId: number): void {
    this.http.get(`https://localhost:7089/api/Users/${userId}`).subscribe(
      (response: any) => {
        const userData = response;
        this.currentFolder = this.formatFolders(userData.folders);
        localStorage.setItem('userData', JSON.stringify(userData));
        this.updateView();
        this.breadcrumbs = [{
          name: 'My Drive',
          node: this.currentFolder,
          index: 0
        }];
      },
      (error: any) => {
        console.error('Failed to fetch user data:', error);
      }
    );
  }

  formatFolders(folders: any[]): FileNode[] {
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      children: [
        ...this.formatFolders(folder.folders), // Add subfolders
        ...folder.files.map((file: { id: any; name: any; fileSize: any; }) => ({
          id: file.id,
          name: file.name,
          type: 'file',
          size: file.fileSize,
          children: [] // Files have no children
        }))
      ]
    }));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a' && this.isFilePreviewVisible) {
      event.preventDefault();
      this.selectAllNodes();
    }

    if (event.key === 'Escape') {
      this.isMultiSelectMode = false;
      this.selectedNode = null;
      this.selectedNodes.clear();
    }

    if (event.key === 'Delete') this.delete();
  }

  selectAllNodes(): void {
    this.isMultiSelectMode = true;
    this.selectedNodes.clear();
    this.currentFolder.forEach(node => this.selectedNodes.add(node));
  }

  areAllNodesSelected(): boolean {
    return this.currentFolder.length > 0 && this.selectedNodes.size === this.currentFolder.length;
  }

  onFolderClick(node: FileNode): void {
    this.selectedNode = node;
  }

  onFolderDoubleClick(node: FileNode): void {
    if (node.type === 'folder') {
      this.navigationStack.push(this.currentFolder); // Save current folder in stack
      this.currentFolder = node.children || []; // Navigate to the selected folder

      this.breadcrumbs.push({
        name: node.name,
        node: node.children || [],
        index: this.breadcrumbs.length,
        id: node.id // Include the folder's ID
      });

      this.uploadService.setCurrentFolderId(node.id ?? null);

      this.updateView();
      this.selectedNode = null;
    }
  }


  selectNode(node: FileNode): void {
    this.selectedNode = node;
  }

  canModify(): boolean {
    return this.selectedNodes.size > 0;
  }

  goBack(): void {
    if (this.navigationStack.length > 0) {
      this.currentFolder = this.navigationStack.pop()!;
      this.breadcrumbs.pop();
      this.updateView();
    }
  }

  canGoBack(): boolean {
    return this.navigationStack.length > 0;
  }

  navigateToBreadcrumb(index: number): void {
    if (index < this.breadcrumbs.length) {
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      this.navigationStack = this.navigationStack.slice(0, index);
      this.currentFolder = this.breadcrumbs[index].node;

      const currentBreadcrumb = this.breadcrumbs[index];
      this.uploadService.setCurrentFolderId(currentBreadcrumb.id ?? null);

      this.updateView();
      this.selectedNode = null;
    }
  }


  private updateView(): void {
    this.dataSource.data = this.currentFolder;
  }

  onFileClick(node: FileNode): void {
    this.selectedNode = node;
  }

  hasChild = (_: number, node: FileNode): boolean => node.type === 'folder';

  createNewFolder(): void {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      // Check for duplicate folders in the current directory
      const folderExists = this.currentFolder.some(item => item.type === 'folder' && item.name === folderName);
      if (folderExists) {
        alert('A folder with this name already exists!');
        return;
      }

      // parent ID based on the breadcrumbs
      const parentId = this.breadcrumbs[this.breadcrumbs.length - 1].id || null;

      // folder create req body
      const folderData = {
        name: folderName,
        userId: parseInt(localStorage.getItem('user_id')!, 10),
        parentId: parentId
      };

      this.http.post('https://localhost:7089/api/Folder', folderData).subscribe((response: any) => {
          // Add the new folder to the current view
          const newFolder: FileNode = {
            id: response.id,
            name: response.name,
            type: 'folder',
            children: []
          };
          this.currentFolder.push(newFolder); // Update the current folder view
          this.updateView(); // Refresh the UI
        }, (error: any) => {
          console.error('Failed to create folder:', error);
          alert('Failed to create folder. Please try again.');
        });
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

      //check for duplicates in current folder
      const fileExists = this.currentFolder.some(item => item.type === 'file' && item.name === fileName);

      if (fileExists) {
        alert('A file with this name and extension already exists!');
        return;
      }

      const userId = localStorage.getItem('user_id') as string;

      const newFile: FileNode = {
        name: fileName,
        fileType: '',
        fileSize: 0,
        fileData: "",
        userId: parseInt(userId, 10),
        type: 'file',
        folderId: this.getCurrentFolderId()
      };

      this.http.post('https://localhost:7089/api/File', newFile).subscribe((response: any) => {
        const newFile: FileNode = {
          id: response.id,
          name: response.name,
          type: 'file',
          children: []
        };
        this.currentFolder.push(newFile); // Update the current folder view
        this.updateView(); // Refresh the UI
      }, (error: any) => {
        console.error('Failed to create folder:', error);
        alert('Failed to create folder. Please try again.');
      });

    }
  }

  formatFileSize(bytes: number): string {
    return FileUtils.formatFileSize(bytes);
  }

  rename(): void {
    const userId = localStorage.getItem('user_id') as string;
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

          this.http.post('https://localhost:7089/api/Folder/Rename/' + userId, { folderId: this.selectedNode.id, newName: newName }).subscribe(() => {
            this.updateView();
          }, (error: any) => {
            console.error('Failed to delete folder(s):', error);
            alert('Failed to delete folder(s). Please try again.');
          });

          // this.updateView();
        }
      }
    }
  }

  download(): void {
    if(this.selectedNode && this.selectedNode.type === 'file') {
      this.http.get(`https://localhost:7089/api/File/DownloadFile?fileId=${this.selectedNode.id}`).subscribe((response: any) => {
        console.log(response, this.selectedNode);
        // const link = document.createElement('a');
        // link.href = `data:application/octet-stream;base64,${response.filedata}`;
        // link.download = fileName;
        // link.click();
      })
    }
  }

  delete(): void {
    const itemsToDelete = this.isMultiSelectMode ? Array.from(this.selectedNodes) : (this.selectedNode ? [this.selectedNode] : []);

    if (itemsToDelete.length === 0) {
      alert('No items selected to delete!');
      return;
    }

    const confirmMessage = itemsToDelete.length === 1
      ? `Are you sure you want to delete the folder "${itemsToDelete[0].name}"?`
      : `Are you sure you want to delete ${itemsToDelete.length} folders?`;
    const confirmDelete = confirm(confirmMessage);

    if (confirmDelete) {
      const folderIdsToDelete = itemsToDelete.map(item => item.id);

      this.http.request('delete', 'https://localhost:7089/api/Folder', { body: folderIdsToDelete, responseType: 'text' }).subscribe(() => {

        this.currentFolder = this.currentFolder.filter(item => !folderIdsToDelete.includes(item.id));

        this.selectedNodes.clear();
        this.selectedNode = null;

        this.updateView();
      }, (error: any) => {
        console.error('Failed to delete folder(s):', error);
        alert('Failed to delete folder(s). Please try again.');
      });
    }
  }

  toggleNodeSelection(node: FileNode, event: MouseEvent | MatCheckboxChange): void {
    if (event instanceof MouseEvent) event.stopPropagation();

    if (this.selectedNodes.has(node)) this.selectedNodes.delete(node);
    else this.selectedNodes.add(node);
  }

  toggleMultiSelectMode(): void {
    this.isMultiSelectMode = !this.isMultiSelectMode;
    if (!this.isMultiSelectMode) this.selectedNodes.clear();

    this.selectedNode = null;
  }

  canDelete(): boolean {
    return this.isMultiSelectMode ? this.selectedNodes.size > 0 : !!this.selectedNode;
  }

  onDrop(event: CdkDragDrop<FileNode[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.currentFolder, event.previousIndex, event.currentIndex);
      this.updateView();
    }
  }

  onFileInput(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.uploadService.addFilesToQueue(Array.from(files));
  }

  onFolderInput(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.uploadService.addFolderToQueue(Array.from(files));
  }

  startUpload(): void {
    this.uploadService.startUpload();
  }

  toggleUploadSection(): void {
    this.showUploadSection = !this.showUploadSection;
  }

  openFileUpload(): void {
    this.uploadService.openFileUpload();
  }

  onFolderOpen(folderId: number) {
    this.fileUploadService.setCurrentFolderId(folderId);
  }

  getCurrentFolderId(): number | null {
    const currentBreadcrumb = this.breadcrumbs[this.breadcrumbs.length - 1];
    return currentBreadcrumb?.id || null;
  }
}