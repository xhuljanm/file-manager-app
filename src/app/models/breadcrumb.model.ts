import { FileNode } from "./file.model";

export interface Breadcrumb {
  name: string;
  node: FileNode[];
  index: number;
  id?: number;
}