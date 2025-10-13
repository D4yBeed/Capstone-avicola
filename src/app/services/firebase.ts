import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail} from 'firebase/auth'
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class Firebase {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore)

  // Auntenticacion

  // Acceder

  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password)
  }


  // Envair email para restablecer la contraseña
  sendRecoveryEmail(email: string){
    return sendPasswordResetEmail(getAuth(), email);
  }

  // setear un documento

  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }


  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }
}