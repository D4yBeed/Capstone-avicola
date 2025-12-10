import { Component, inject, OnInit } from '@angular/core';
import { Utils } from 'src/app/services/utils';
import { Firebase } from 'src/app/services/firebase'; // Asegúrate de importar Firebase
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  form!: FormGroup;
  user!: User;
  userId: string | null = null;
  ready = false;

  utilsSvc = inject(Utils);
  firebaseSvc = inject(Firebase); // Inyectamos el servicio
  user: User | null = null;

  ngOnInit() {
    // Carga inicial rápida desde lo guardado (puede fallar si está vacío)
    this.user = this.utilsSvc.getFromLocalStorage('user');
  }

  // 🔹 SOLUCIÓN: Este evento se ejecuta SIEMPRE que la página se va a mostrar
  ionViewWillEnter() {
    this.getFreshUserData();
  }

  // Función para obtener datos frescos de la base de datos
  async getFreshUserData() {
    this.firebaseSvc.getAuth().onAuthStateChanged(async (auth) => {
      if (auth) {
        try {
          const path = `users/${auth.uid}`;
          const userData = await this.firebaseSvc.getDocument(path) as User;
          
          if (userData) {
            // Actualizamos la variable local y el localStorage
            this.user = userData;
            this.utilsSvc.saveInLocalStorage('user', this.user);
          }
        } catch (error) {
          console.error('Error al recargar usuario:', error);
        }
      }
    });
  }

  // --- Helpers de Roles ---

  isPollero(): boolean {
    return this.user?.role === 'pollero';
  }

  isStaff(): boolean {
    return this.user?.role === 'supervisor' || this.user?.role === 'encargado';
  }

  // --- Navegación ---
  navigateTo(path: string) {
    this.utilsSvc.routerLink(path);
  }
}
