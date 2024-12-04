import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';


@Component({
	selector: 'app-root',
	imports: [RouterOutlet],
  	templateUrl: './app.component.html',
  	styleUrl: './app.component.scss'
})
export class AppComponent {
	title = 'file-manager-app';
}
