export interface FileNode {
  name: string;
  type: 'folder' | 'file';
  size?: number;
  buffer?: ArrayBuffer;
  children?: FileNode[];
  loaded?: boolean;
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