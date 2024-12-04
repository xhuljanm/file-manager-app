import {Component, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-account',
  imports: [MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.scss'
})
export class MyAccountComponent implements OnInit {
	username: string = 'shefi';
	accountId: string = '12345678';
	accountType: string = 'Admin';

	constructor() {}

	ngOnInit(): void {
	}

	copy(value: string) {
		navigator.clipboard.writeText(value).then(() => '', (err) => console.error('Failed to copy: ', err));
	}
}
