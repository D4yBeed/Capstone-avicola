import { Component, OnInit, inject } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';
import { Eggs, EggRecord } from 'src/app/services/eggs';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';
// Agregamos 'collection' para buscar los usuarios
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false
})
export class HistoryPage implements OnInit {

  firebaseSvc = inject(Firebase);
  eggsSvc = inject(Eggs);
  utilsSvc = inject(Utils);

  user!: User;
  records: EggRecord[] = [];
  loading = false;
  
  // 🔹 DICCIONARIO PARA LOS NOMBRES: {'uid123': 'Juan Perez', ...}
  userNames: Record<string, string> = {}; 

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    this.loadRecords();
    this.loadUsersMap(); // 🔹 Cargamos los nombres al iniciar
  }

  // 🔹 NUEVA FUNCIÓN: Carga todos los usuarios y crea un mapa ID -> Nombre
  async loadUsersMap() {
    try {
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, 'users'));
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as User;
        // Guardamos: userNames['k3zl...'] = 'Diego Santis'
        this.userNames[data.uid] = data.name || 'Usuario';
      });
    } catch (e) {
      console.error('Error cargando nombres:', e);
    }
  }

  // 🔹 Carga el historial según el rol del usuario (Mantenemos tu lógica)
  async loadRecords(event?: any) {
    this.loading = true;

    try {
      // ... (Aquí va toda tu lógica existente de fechas y roles que ya tenías) ...
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      const startDate = start.toISOString().slice(0, 10);

      if (this.user.role === 'pollero' && this.user.assignedShed) {
        const db = getFirestore();
        const colRef = collection(db, `farms/ELMOLLE/sheds/${this.user.assignedShed}/eggRecords`);
        const q = query(
          colRef,
          where('userId', '==', this.user.uid),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        this.records = snapshot.docs.map(d => d.data() as EggRecord);
      } else {
        const db = getFirestore();
        const allRecords: EggRecord[] = [];
        for (let s = 1; s <= 7; s++) {
          for (const letter of ['A', 'B']) {
            const shedId = `S${s}${letter}`;
            const colRef = collection(db, `farms/ELMOLLE/sheds/${shedId}/eggRecords`);
            const q = query(
              colRef,
              where('date', '>=', startDate),
              where('date', '<=', endDate),
              orderBy('date', 'desc')
            );
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(d => allRecords.push(d.data() as EggRecord));
          }
        }
        this.records = allRecords;
      }
      this.records.sort((a, b) => (a.date < b.date ? 1 : -1));

    } catch (err) {
      console.error(' Error al cargar historial:', err);
      // ... (Tu manejo de errores) ...
    } finally {
      this.loading = false;
      if (event) event.target.complete();
    }
  }

  // ... (resto de funciones: formatDate, total, doRefresh) ...
  formatDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  total(record: EggRecord) {
    return Object.values(record.counts || {}).reduce((a, b) => a + (b || 0), 0);
  }

  async doRefresh(event: any) {
    await this.loadUsersMap(); // 🔹 Refrescamos nombres también
    await this.loadRecords();
    event.target.complete();
  }
}