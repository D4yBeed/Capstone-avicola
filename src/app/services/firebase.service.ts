import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);

////////////Autenticacion///////////////



            ////Acceder///

  sigIn(user: User) {
  return this.auth.signInWithEmailAndPassword(user.email, user.password);
}

            ////Crear Usuario///

  sigUp(user: User) {
  return this.auth.createUserWithEmailAndPassword(user.email, user.password);
  }

  // =========== Actualizar Usuario ===========
  UpdateUser(displayName: string){
    return updateProfile(getAuth().currentUser, {displayName})
  }

}
