import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-my-files',
  imports: [MatListModule, MatIcon, MatToolbarModule, CommonModule],
  templateUrl: './my-files.component.html',
  styleUrl: './my-files.component.scss'
})
export class MyFilesComponent {
	files = [
		{ name: 'Document.pdf', modifiedAt: 'Today', type: 'File', size: '100KB', starred: false },
		{ name: 'Photos', modifiedAt: 'Yesterday', type: 'Folder', size: '50KB', starred: true }
	];
	opened: any;

	constructor(private dialog: MatDialog) {}

	// openUploadDialog() {
	// 	this.dialog.open(UploadDialogComponent);
	// }

	deleteFile(index: number) {
		this.files.splice(index, 1);
	}
}
