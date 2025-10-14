import { Component, inject, OnInit } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {
  }


  // cerrar sesion

  signOut() {
    this.firebaseSvc.signOut();
  }

}
