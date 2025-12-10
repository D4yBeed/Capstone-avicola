import { Component, OnInit, inject } from '@angular/core';
import { Eggs, EggRecord, EggKey } from 'src/app/services/eggs';
import { Utils } from 'src/app/services/utils';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false
})
export class ReportsPage implements OnInit {

  eggsSvc = inject(Eggs);
  utilsSvc = inject(Utils);

  farmId = 'ELMOLLE';
  selectedShed = 'S1A';
  today = new Date().toISOString().slice(0, 10);
  records: EggRecord[] = [];
  chart?: Chart;
  chartType: 'bar' | 'pie' = 'bar'; // 👈 tipo de gráfico actual

  // Galpones disponibles
  sheds = Array.from({ length: 7 }, (_, i) =>
    ['A', 'B'].map(letter => ({
      id: `S${i + 1}${letter}`,
      label: `Sector ${i + 1} - Galpón ${letter}`
    }))
  ).flat();

  // Totales
  totals: Record<EggKey, number> = {
    incubables_nido: 0, incubables_piso: 0,
    sucios_nido: 0, sucios_piso: 0,
    trizados_nido: 0, trizados_piso: 0,
    dobles_nido: 0, dobles_piso: 0,
  };

  ngOnInit() {
    this.loadReport();
  }

  async loadReport() {
    try {
      const end = this.today;
      const start = this.addDays(end, -6);

      const loading = await this.utilsSvc.loading('Cargando reporte...');
      await loading.present();

      this.records = await this.eggsSvc.listByDateRange(this.farmId, this.selectedShed, start, end);
      this.calculateTotals();
      this.renderChart();

      loading.dismiss();

    } catch (error) {
      console.error('Error al generar reporte:', error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar el reporte',
        color: 'danger',
        duration: 2500,
        icon: 'alert-circle-outline'
      });
    }
  }

  calculateTotals() {
    Object.keys(this.totals).forEach(key => this.totals[key as EggKey] = 0);
    for (const record of this.records) {
      for (const key of Object.keys(record.counts) as EggKey[]) {
        this.totals[key] += record.counts[key] || 0;
      }
    }
  }

  renderChart() {
    setTimeout(() => {
      const ctx = document.getElementById('eggsChart') as HTMLCanvasElement;
      if (!ctx) return;

      if (this.chart) this.chart.destroy();

      const labels = Object.keys(this.totals).map(k => k.replace('_', ' '));
      const values = Object.values(this.totals);

      const backgroundColors = [
        '#e53935', '#ff7043', '#fb8c00', '#fdd835',
        '#43a047', '#1e88e5', '#8e24aa', '#6d4c41'
      ];

      this.chart = new Chart(ctx, {
        type: this.chartType,
        data: {
          labels,
          datasets: [{
            label: 'Cantidad de Huevos',
            data: values,
            backgroundColor: backgroundColors
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: this.chartType === 'pie' }
          },
          scales: this.chartType === 'bar'
            ? { y: { beginAtZero: true } }
            : {}
        }
      });
    }, 300);
  }

  toggleChartType() {
    this.chartType = this.chartType === 'bar' ? 'pie' : 'bar';
    this.renderChart();
  }

  onShedChange() {
    this.loadReport();
  }

  private addDays(dateYmd: string, offset: number): string {
    const d = new Date(dateYmd + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

}
