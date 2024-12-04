import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-searchbar',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatToolbarModule, MatInputModule],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss'
})
export class SearchbarComponent {
	searchQuery: string = ''; // Initialize the searchQuery

	onSearch() {
		console.log('Searching for:', this.searchQuery);
	}

	clearSearch() {
		this.searchQuery = ''; // Clears the search input
	}
}
