import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
  standalone: false
})
export class AdminUsersPage implements OnInit {

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);
  fb = inject(FormBuilder);

  form!: FormGroup;
  sheds: any[] = [];
  users: any[] = [];

  ngOnInit() {
    this.initForm();
    this.generateSheds();
    this.loadUsers();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      // Contraseña con límites (mínimo 6, máximo 20)
      password: ['', [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(20)
      ]],
      role: ['pollero', Validators.required], // Valor por defecto: pollero
      // Inicialmente obligatorio porque el rol por defecto es 'pollero'
      assignedShed: ['', Validators.required] 
    });

    // 🔹 Lógica para activar/desactivar la obligatoriedad del galpón
    this.form.get('role')?.valueChanges.subscribe(role => {
      const shedControl = this.form.get('assignedShed');

      if (role === 'pollero') {
        // Si es pollero, el galpón es REQUERIDO
        shedControl?.setValidators([Validators.required]);
      } else {
        // Si es otro rol, quitamos validadores y limpiamos el valor
        shedControl?.clearValidators();
        shedControl?.reset();
      }
      // Actualizar el estado de validación del control
      shedControl?.updateValueAndValidity();
    });
  }

  generateSheds() {
    this.sheds = Array.from({ length: 7 }, (_, i) =>
      ['A', 'B'].map(letter => ({
        id: `S${i + 1}${letter}`,
        label: `Sector ${i + 1} - Galpón ${letter}`
      }))
    ).flat();
  }

  async createUser() {
    if (this.form.invalid) {
      this.utilsSvc.presentToast({
        message: 'Por favor completa todos los campos obligatorios (si es pollero, debe tener galpón asignado)',
        color: 'warning',
        duration: 2500,
        icon: 'alert-circle-outline'
      });
      return;
    }

    const loading = await this.utilsSvc.loading('Creando usuario...');
    await loading.present();

    try {
      const { name, email, password, role, assignedShed } = this.form.value;
      
      await this.firebaseSvc.createUserWithRole(
        { name, email, password },
        role,
        assignedShed
      );

      this.utilsSvc.presentToast({
        message: `Usuario ${name} creado correctamente`,
        color: 'success',
        duration: 2500,
        icon: 'checkmark-circle-outline'
      });

      // Resetear formulario manteniendo 'pollero' por defecto
      this.form.reset({ role: 'pollero' });
      this.loadUsers();

    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      this.utilsSvc.presentToast({
        message: error.message,
        color: 'danger',
        duration: 3000,
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  // ... resto de funciones (loadUsers, updateRole, deleteUser) igual que antes ...
  async loadUsers() {
    const db = getFirestore();
    const snapshot = await getDocs(collection(db, 'users'));
    this.users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async updateRole(userId: string, role: string) {
    const db = getFirestore();
    await updateDoc(doc(db, 'users', userId), { role });
    this.utilsSvc.presentToast({
      message: 'Rol actualizado correctamente',
      color: 'success',
      duration: 2000,
      icon: 'checkmark-circle-outline'
    });
  }

  // ... (código anterior)

  async deleteUser(userId: string) {
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Eliminar usuario',
      message: '¿Seguro que deseas eliminar este usuario? Perderá el acceso inmediatamente.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.utilsSvc.loading('Eliminando...');
            await loading.present();

            try {
              // Usamos el nuevo método del servicio
              await this.firebaseSvc.deleteUserDocument(userId);
              
              // Actualizamos la lista visualmente
              this.loadUsers(); 
              
              this.utilsSvc.presentToast({
                message: 'Usuario eliminado correctamente.',
                color: 'success',
                duration: 2000,
                icon: 'trash-outline'
              });
            } catch (e) {
              console.error(e);
              this.utilsSvc.presentToast({
                message: 'Error al eliminar usuario',
                color: 'danger',
                duration: 2000
              });
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await confirm.present();
  }
}