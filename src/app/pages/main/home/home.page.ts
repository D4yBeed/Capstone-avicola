import { Component, OnInit } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  nombreUsuario: string = '';

  constructor(private firebaseService: Firebase) {}

  ngOnInit() {
    this.firebaseService.auth.authState.subscribe(user => {
      if(user) {
        // displayName o email antes del @
        this.nombreUsuario = user.displayName || user.email?.split('@')[0] || '';
      } else {
        this.nombreUsuario = 'Invitado';
      }
    });
  }
}
