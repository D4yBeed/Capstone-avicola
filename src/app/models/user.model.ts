export interface User {
  uid: string;
  email: string;
  password?: string;        // ⚠️ normalmente nunca guardamos password en Firestore
  name: string;
  role: 'supervisor' | 'encargado' | 'pollero';
  assignedShed?: string;    // opcional, porque solo aplica a "pollero"
}
