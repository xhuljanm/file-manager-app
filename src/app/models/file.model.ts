export interface FileNode {
  id?: number;
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  size?: number;
  fileType?: string;
  fileSize?: number;
  fileData?: string;
  folders?: FileNode[];
  files?: FileNode[];
  userId?: number | null;
  folderId?: number | null;
}

export interface UploadItem {
  path: string;
  type: 'file' | 'folder';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
  file?: File;
  isFolder?: boolean;
  relativePath?: string;
}

export interface FolderUpload {
  name: string;
  files: File[];
  totalSize: number;
  fileCount: number;
}

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