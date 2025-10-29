export interface User {
  uid: string;
  name?: string;
  email: string;
  password?: string;
  role?: 'supervisor' | 'encargado' | 'pollero';
  assignedShed?: string | null;
}