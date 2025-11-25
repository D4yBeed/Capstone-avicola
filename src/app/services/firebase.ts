import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile, 
  updatePassword 
} from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Utils } from '../services/utils';

@Injectable({
  providedIn: 'root'
})
export class Firebase {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  utilsSvc = inject(Utils);

  //  Obtener instancia de autenticación
  getAuth() {
    return getAuth();
  }

  //  Iniciar sesión
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  //  Cerrar sesión
  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth');
  }

  // 🔹 Enviar correo de recuperación de contraseña
  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  // 🔹 Guardar documento en Firestore
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  // 🔹 Obtener documento de Firestore
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  // ✅ Crear usuario con rol y galpón asignado (solo supervisores)
  async createUserWithRole(
    user: { name: string; email: string; password: string },
    role: 'supervisor' | 'encargado' | 'pollero',
    assignedShed?: string
  ) {
    const auth = getAuth();
    const db = getFirestore();

    // Crear usuario en Firebase Authentication
    const credential = await createUserWithEmailAndPassword(auth, user.email, user.password);

    // Datos del nuevo usuario
    const newUser = {
      uid: credential.user.uid,
      name: user.name,
      email: user.email,
      role,
      assignedShed: assignedShed || null,
      createdAt: serverTimestamp()
    };

    // Guardar usuario en Firestore
    await setDoc(doc(db, 'users', credential.user.uid), newUser);

    return newUser;
  }
  //  Actualizar Nombre (Auth + Firestore)
  async updateUserProfile(name: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      // 1. Actualizar en Auth
      await updateProfile(user, { displayName: name });
      // 2. Actualizar en Firestore
      const db = getFirestore();
      await updateDoc(doc(db, 'users', user.uid), { name });
      return true;
    }
    return false;
  }

  //  Actualizar Contraseña
  async updateUserPassword(newPass: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPass);
      return true;
    }
    return false;
  }
}















// import { inject, Injectable } from '@angular/core';
// import { AngularFireAuth } from '@angular/fire/compat/auth'
// import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword} from 'firebase/auth'
// import { User } from '../models/user.model';
// import { AngularFirestore } from '@angular/fire/compat/firestore';
// import { getFirestore, setDoc, doc, getDoc, serverTimestamp } from '@angular/fire/firestore';
// import { Utils } from '../services/utils';

// @Injectable({
//   providedIn: 'root'
// })
// export class Firebase {

//   auth = inject(AngularFireAuth);
//   firestore = inject(AngularFirestore)
//   utilsSvc = inject(Utils);

//   // Auntenticacion

//   getAuth(){
//     return getAuth();
//   }

//   // Acceder

//   signIn(user: User) {
//     return signInWithEmailAndPassword(getAuth(), user.email, user.password)
//   }

//   // Cerrar sesion

//   signOut(){
//     getAuth().signOut();
//     localStorage.removeItem('user');
//     this.utilsSvc.routerLink('/auth');
//   }

//   // Envair email para restablecer la contraseña
//   sendRecoveryEmail(email: string){
//     return sendPasswordResetEmail(getAuth(), email);
//   }

//   // setear un documento

//   setDocument(path: string, data: any) {
//     return setDoc(doc(getFirestore(), path), data);
//   }


//   async getDocument(path: string) {
//     return (await getDoc(doc(getFirestore(), path))).data();
//   }

//   async createUserWithRole(user: any, role: string, assignedShed?: string) {
//   const auth = getAuth();
//   const firestore = getFirestore();

//   // Crear cuenta en Firebase Auth
//   const cred = await createUserWithEmailAndPassword(auth, user.email, user.password);

//   // Guardar datos en Firestore
//   const userData = {
//     uid: cred.user.uid,
//     name: user.name,
//     email: user.email,
//     role,
//     assignedShed: assignedShed || null,
//     createdAt: serverTimestamp(),
//   };

  

//   await setDoc(doc(firestore, 'users', cred.user.uid), userData);
//   return userData;
// }


// }