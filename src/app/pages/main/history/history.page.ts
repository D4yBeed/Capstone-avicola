import { Component, OnInit, inject } from '@angular/core';
import { Eggs, EggRecord } from 'src/app/services/eggs';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,
})
export class HistoryPage implements OnInit {

  eggsSvc = inject(Eggs);
  utilsSvc = inject(Utils);

  farmId = 'ELMOLLE'; // puedes hacerlo dinámico más adelante
  shedId = 'S1A';     // ejemplo: Sector 1 - Galpón A
  today = this.getTodayYMD();

  records: EggRecord[] = [];
  loading = true;

  ngOnInit() {
    this.loadHistory();
  }

  // 🔹 Obtener la fecha de hoy en formato YYYY-MM-DD
  getTodayYMD(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  // 🔹 Cargar los últimos 7 días desde Firestore
  async loadHistory() {
    this.loading = true;

    try {
      this.records = await this.eggsSvc.listLastNDays(this.farmId, this.shedId, this.today, 7);
      // Ordenar por fecha descendente (más reciente primero)
      this.records = this.records.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar el historial.',
        color: 'danger',
        duration: 2500,
        position: 'middle'
      });
    } finally {
      this.loading = false;
    }
  }
}