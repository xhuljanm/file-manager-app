import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared/shared.service';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnInit {
  preview: string = '';

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sharedService.fileContent$.subscribe(content => {
      this.preview = atob(content); // Decode and show content
    });
  }
}