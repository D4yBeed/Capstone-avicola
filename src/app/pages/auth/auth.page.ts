import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        // 1. Autenticación con Firebase Auth (Email y contraseña)
        const res = await this.firebaseSvc.signIn(this.form.value as User);

        // 2. ✅ ESTA ES LA LÍNEA IMPORTANTE
        // Obtiene el rol y el nombre desde la base de datos usando el UID
        await this.getUserInfo(res.user.uid);

      } catch (error: any) {
        console.error(error);
        
        // Usamos la función para mostrar errores claros en español
        const cleanMessage = this.mapFirebaseError(error.code);

        this.utilsSvc.presentToast({
          message: cleanMessage,
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      } finally {
        loading.dismiss();
      }
    }
  }

  // 🔹 Función para obtener datos del usuario (Rol, Nombre, Galpón)
  async getUserInfo(uid: string) {
    try {
      const path = `users/${uid}`;
      const user = (await this.firebaseSvc.getDocument(path)) as User;

      if (user) {
        // Guardar usuario en LocalStorage para usarlo en toda la app
        this.utilsSvc.saveInLocalStorage('user', user);

        // Redirigir al Home
        this.utilsSvc.routerLink('/main/home');
        this.form.reset();

        this.utilsSvc.presentToast({
          message: `¡Bienvenido ${user.name || user.email}!`,
          duration: 2000,
          color: 'success', // Cambié a success para que se vea verde/positivo
          position: 'middle',
          icon: 'person-circle-outline'
        });
      } else {
        // Si el usuario existe en Auth pero no en la BD (caso raro)
        this.utilsSvc.presentToast({
          message: 'Error: No se encontraron los datos del usuario.',
          duration: 2500,
          color: 'warning',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      }
    } catch (error) {
      console.error(error);
      this.utilsSvc.presentToast({
        message: 'Error al obtener información del usuario',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }
  }

  // 🔹 Traductor de errores de Firebase
  private mapFirebaseError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Usuario no encontrado o contraseña incorrecta.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intente más tarde.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Revise su internet.';
      default:
        return 'Error al iniciar sesión. Verifique sus datos.';
    }
  }
}

