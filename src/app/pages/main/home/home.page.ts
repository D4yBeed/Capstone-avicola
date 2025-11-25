import { Component, inject, OnInit } from '@angular/core';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  utilsSvc = inject(Utils);
  user: User | null = null;

  ngOnInit() {
    // Cargar usuario desde el almacenamiento local
    this.user = this.utilsSvc.getFromLocalStorage('user');
  }

  // --- Helpers de Roles ---

  // Pollero: Ve Registro Huevos, Perfil y Reportes
  isPollero(): boolean {
    return this.user?.role === 'pollero';
  }

  // Supervisor o Encargado: Ve Admin Users, Historial, Perfil y Reportes
  isStaff(): boolean {
    return this.user?.role === 'supervisor' || this.user?.role === 'encargado';
  }

  // --- Navegación ---
  
  navigateTo(path: string) {
    this.utilsSvc.routerLink(path);
  }
}