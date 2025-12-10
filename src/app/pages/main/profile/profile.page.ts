import { Component, inject, OnInit } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';
import { AlertController } from '@ionic/angular'; // 👈 Importar AlertController

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);
  alertCtrl = inject(AlertController); // 👈 Inyectar

  user: User | null = null;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
  }

  // 🔹 Editar Nombre
  async editName() {
    const alert = await this.alertCtrl.create({
      header: 'Editar Nombre',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: this.user?.name,
          placeholder: 'Ingresa tu nombre'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.name.trim().length < 3) {
              this.utilsSvc.presentToast({ message: 'El nombre debe tener al menos 3 caracteres', color: 'warning' });
              return false;
            }
            await this.updateNameLogic(data.name);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async updateNameLogic(newName: string) {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    try {
      await this.firebaseSvc.updateUserProfile(newName);
      
      // Actualizar localstorage y vista
      if (this.user) {
        this.user.name = newName;
        this.utilsSvc.saveInLocalStorage('user', this.user);
      }
      
      this.utilsSvc.presentToast({ message: 'Nombre actualizado', color: 'success', icon: 'checkmark-circle-outline' });
    } catch (error) {
      console.error(error);
      this.utilsSvc.presentToast({ message: 'Error al actualizar nombre', color: 'danger' });
    } finally {
      loading.dismiss();
    }
  }

  // 🔹 Cambiar Contraseña
  async changePassword() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar Contraseña',
      message: 'Ingresa tu nueva contraseña (mínimo 6 caracteres)',
      inputs: [
        {
          name: 'newPass',
          type: 'password',
          placeholder: 'Nueva contraseña'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: async (data) => {
            if (data.newPass.length < 6) {
              this.utilsSvc.presentToast({ message: 'La contraseña debe tener mínimo 6 caracteres', color: 'warning' });
              return false;
            }
            await this.updatePasswordLogic(data.newPass);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async updatePasswordLogic(newPass: string) {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    try {
      await this.firebaseSvc.updateUserPassword(newPass);
      this.utilsSvc.presentToast({ message: 'Contraseña actualizada correctamente', color: 'success', icon: 'checkmark-circle-outline' });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        this.utilsSvc.presentToast({ message: 'Por seguridad, debes volver a iniciar sesión para cambiar la contraseña.', color: 'warning', duration: 4000 });
        this.signOut();
      } else {
        this.utilsSvc.presentToast({ message: 'Error al actualizar contraseña', color: 'danger' });
      }
    } finally {
      loading.dismiss();
    }
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
    await alert.present();
  }
}