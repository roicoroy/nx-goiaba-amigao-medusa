import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { 
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon
} from '@ionic/angular/standalone';
import { GoiabaHeaderComponent, GoiabaFooterComponent, GoiabaCardComponent } from 'src/app/components/goiaba-components';
import * as L from 'leaflet';

@Component({
  selector: 'app-find-us',
  templateUrl: './find-us.page.html',
  styleUrls: ['./find-us.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    GoiabaHeaderComponent,
    GoiabaFooterComponent,
    GoiabaCardComponent,
    IonContent,
    IonIcon
  ]
})
export class FindUsPage implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private isInteractive = false;

  // Location - Mini Mercado Amigão, Rua Amazonas, 211, Álvares Florence, SP, Brazil
  // Extracted from: https://www.google.com/maps/place/R.+Amazonas,+211+-+%C3%81lvares+Florence,+SP,+15540-000,+Brazil/@-20.3214949,-49.9144323,17z
  private readonly defaultLat = -20.3214949;
  private readonly defaultLng = -49.9118574;
  private readonly defaultZoom = 17;

  ngOnInit() {
    // Fix for default marker icon issue in Leaflet
    this.fixDefaultIcon();
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure DOM is fully ready and view is initialized
    // This is important for Nx build optimization and Angular change detection
    setTimeout(() => {
      this.initMap();
    }, 0);
  }

  private fixDefaultIcon(): void {
    // Use Leaflet CDN for default marker icons to avoid 404 errors
    // Alternatively, you can copy the marker icons from node_modules/leaflet/dist/images/
    // to assets/leaflet/ if you want to host them locally
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.warn('Map element not found. Retrying in 100ms...');
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded');
      return;
    }

    try {
      // Initialize the map with interactions disabled by default
      this.map = L.map(mapElement, {
        center: [this.defaultLat, this.defaultLng],
        zoom: this.defaultZoom,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Add a marker
      L.marker([this.defaultLat, this.defaultLng])
        .addTo(this.map)
        .bindPopup('Mini Mercado Amigão<br>Rua Amazonas, 211<br>Álvares Florence, SP<br>CEP: 15540-000')
        .openPopup();

      // Add double-tap/click listener to enable interactions
      this.map.on('dblclick', () => {
        this.enableMapInteraction();
      });

      // Also handle double-tap on mobile (touch events)
      let lastTap = 0;
      this.map.getContainer().addEventListener('touchend', (e: TouchEvent) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
          // Double tap detected
          e.preventDefault();
          this.enableMapInteraction();
        }
        lastTap = currentTime;
      });

      // Fix map size after view initialization - important for Nx builds
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private enableMapInteraction(): void {
    if (this.isInteractive) {
      return;
    }

    this.isInteractive = true;
    this.map.dragging.enable();
    this.map.touchZoom.enable();
    this.map.doubleClickZoom.enable();
    this.map.scrollWheelZoom.enable();
    this.map.boxZoom.enable();
    this.map.keyboard.enable();
  }
}
