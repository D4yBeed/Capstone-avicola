import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Firebase } from '../services/firebase';
import { Utils } from '../services/utils';
import { take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return new Promise(async (resolve) => {

      // 1. Obtener el usuario autenticado de Firebase Auth
      const authUser = this.firebaseSvc.getAuth().currentUser;

      if (authUser) {
        // 2. Obtener los datos del usuario desde la Base de Datos (Firestore)
        // Esto es más seguro que leer del localStorage porque el usuario no puede editarlo
        const userDoc = await this.firebaseSvc.getDocument(`users/${authUser.uid}`);

        // 3. Verificar si el usuario existe y obtener su rol
        if (userDoc && userDoc['role']) {
          const userRole = userDoc['role'];
          
          // Definir roles permitidos. 
          // Por defecto, dejaremos entrar a supervisores y encargados a rutas protegidas.
          // Puedes ajustar esto según la lógica que necesites.
          const allowedRoles = ['supervisor', 'encargado']; 

          // Nota: Si quieres que la ruta defina qué roles entran, puedes usar:
          // const expectedRoles = route.data['expectedRoles'];

          if (allowedRoles.includes(userRole)) {
            resolve(true); // ✅ Tiene permiso
          } else {
            // ⛔ No tiene permiso (ej. es 'pollero')
            this.utilsSvc.presentToast({
              message: 'No tienes permisos de administrador para acceder a esta sección.',
              duration: 2500,
              color: 'warning',
              icon: 'lock-closed-outline'
            });
            this.utilsSvc.routerLink('/main/home'); // Redirigir al home
            resolve(false);
          }

        } else {
          // Si no hay datos en la BD
          this.utilsSvc.routerLink('/auth');
          resolve(false);
        }

      } else {
        // Si no está logueado
        this.utilsSvc.routerLink('/auth');
        resolve(false);
      }
    });
  }
}