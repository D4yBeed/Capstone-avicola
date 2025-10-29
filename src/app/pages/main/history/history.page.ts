import { Component, OnInit, inject } from '@angular/core';
import { Firebase } from 'src/app/services/firebase';
import { Eggs, EggRecord } from 'src/app/services/eggs';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';

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

  async loadRecords() {
    try {
      this.loading = true;
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      const startDate = start.toISOString().slice(0, 10);

      // 🔐 Si el usuario es pollero → solo su galpón
      if (this.user.role === 'pollero' && this.user.assignedShed) {
        this.records = await this.eggsSvc.listByDateRange('ELMOLLE', this.user.assignedShed, startDate, endDate);
      } 
      // 👷‍♂️ Encargado o Supervisor → todos los galpones
      else {
        const all = [];
        for (let s = 1; s <= 7; s++) {
          for (const letter of ['A', 'B']) {
            const shedId = `S${s}${letter}`;
            const data = await this.eggsSvc.listByDateRange('ELMOLLE', shedId, startDate, endDate);
            all.push(...data);
          }
        }
        this.records = all;
      }

      this.records.sort((a, b) => (a.date < b.date ? 1 : -1)); // Más recientes primero
    } catch (err) {
      console.error(err);
      this.utilsSvc.presentToast({
        message: 'Error al cargar el historial',
        color: 'danger',
        duration: 1800
      });
    } finally {
      this.loading = false;
    }
  }

  formatDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  total(record: EggRecord) {
    return Object.values(record.counts || {}).reduce((a, b) => a + (b || 0), 0);
  }
}
