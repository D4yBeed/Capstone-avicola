import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  signOut // 👈 Importamos signOut
} from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc // 👈 Importamos deleteDoc
} from '@angular/fire/firestore';
import { Utils } from '../services/utils';

// 🔹 IMPORTANTE: Importar initializeApp y deleteApp para el truco de la sesión
import { initializeApp, deleteApp } from 'firebase/app';
import { environment } from 'src/environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class Firebase {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  utilsSvc = inject(Utils);

  getAuth() {
    return getAuth();
  }

  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth');
  }

  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  async updateUserProfile(name: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName: name });
      const db = getFirestore();
      await updateDoc(doc(db, 'users', user.uid), { name });
      return true;
    }
    return false;
  }

  async updateUserPassword(newPass: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPass);
      return true;
    }
    return false;
  }

  //  MÉTODO CORREGIDO: Crear usuario SIN cerrar sesión del supervisor
  async createUserWithRole(user: any, role: string, assignedShed?: string) {
    
    // 1. Crear una instancia secundaria de la App de Firebase
    // Esto aísla la autenticación del nuevo usuario para que no afecte la tuya
    const secondaryApp = initializeApp(environment.firebaseConfig, 'Secondary');
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 2. Crear usuario en la instancia secundaria
      const credential = await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
      
      // 3. Guardar datos en Firestore (usamos la base de datos principal)
      const db = getFirestore();
      const newUser = {
        uid: credential.user.uid,
        name: user.name,
        email: user.email,
        role,
        assignedShed: assignedShed || null,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', credential.user.uid), newUser);

      // 4. Retornar el usuario creado
      return newUser;

    } catch (error) {
      throw error;
    } finally {
      // 5. Cerrar sesión en la instancia secundaria y eliminarla para liberar memoria
      await signOut(secondaryAuth);
      deleteApp(secondaryApp); 
    }
  }
  
  // MÉTODO PARA ELIMINAR (Borrado lógico/físico en Firestore)
  async deleteUserDocument(uid: string) {
    const db = getFirestore();
    return deleteDoc(doc(db, 'users', uid));
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