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
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['pollero', Validators.required],
      assignedShed: ['']
    });

    this.form.get('role')?.valueChanges.subscribe(role => {
      if (role !== 'pollero') {
        this.form.get('assignedShed')?.reset();
      }
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
        message: 'Completa todos los campos requeridos',
        color: 'warning',
        duration: 2000,
        icon: 'alert-circle-outline'
      });
      return;
    }

    const loading = await this.utilsSvc.loading('Creando usuario...');
    await loading.present();

    try {
      const { name, email, password, role, assignedShed } = this.form.value;
      const newUser = await this.firebaseSvc.createUserWithRole(
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

  async deleteUser(userId: string) {
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Eliminar usuario',
      message: '¿Seguro que deseas eliminar este usuario?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            const db = getFirestore();
            await deleteDoc(doc(db, 'users', userId));
            this.loadUsers();
            this.utilsSvc.presentToast({
              message: 'Usuario eliminado correctamente',
              color: 'danger',
              duration: 2000,
              icon: 'trash-outline'
            });
          }
        }
      ]
    });
    await confirm.present();
  }
}
