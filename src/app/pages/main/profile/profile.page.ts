import { Component, inject, OnInit } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  user!: User | null;
  darkMode = false;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', this.darkMode);
  }

// Desactivamos completamente el modo oscuro
toggleDarkMode() {
  return;
}

  async signOut() {
    const alert = await this.utilsSvc.presentAlert({
      header: 'Cerrar sesión',
      message: '¿Deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          handler: () => this.firebaseSvc.signOut()
        }
      ]
    });
    await alert.present(); // ✅ ahora funciona correctamente
  }

  isSupervisor(): boolean {
    return this.user?.role === 'supervisor';
  }

  isEncargado(): boolean {
    return this.user?.role === 'encargado';
  }

  isPollero(): boolean {
    return this.user?.role === 'pollero';
  }
}