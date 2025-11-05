import { Component, OnInit, inject } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';
import { Eggs, EggRecord } from 'src/app/services/eggs';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';
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

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    this.loadRecords();
  }

  // 🔹 Carga el historial según el rol del usuario
  async loadRecords(event?: any) {
  this.loading = true;

  try {
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
    console.error('❌ Error al cargar historial:', err);
    this.utilsSvc.presentToast({
      message: 'Error al cargar el historial',
      color: 'danger',
      duration: 1800
    });
  } finally {
    this.loading = false;
    if (event) event.target.complete(); // 👈 para cerrar el refresher
  }
}


  // 🔹 Formatear fecha para vista legible
  formatDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // 🔹 Calcular total diario del registro
  total(record: EggRecord) {
    return Object.values(record.counts || {}).reduce((a, b) => a + (b || 0), 0);
  }

  // 🔹 Refrescar con "pull-to-refresh"
  async doRefresh(event: any) {
    await this.loadRecords();
    event.target.complete();
  }
}
