import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  IonContent,
  IonIcon, IonNote, IonLabel, IonItem, IonCardContent, IonList, IonCardTitle, IonCardHeader, IonCard, IonButton } from '@ionic/angular/standalone';
import { GoiabaHeaderComponent, GoiabaFooterComponent } from 'src/app/components/goiaba-components';
import { ThemeComponent } from 'src/app/components/theme/theme.component';
import { TranslateComponent } from 'src/app/components/translate/translate.component';
import { ThemeService } from 'src/app/shared/theme/theme.service';
import { RegionSelectComponent } from 'src/app/components/region-select/region-select.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonButton, IonCard, IonCardHeader, IonCardTitle, IonList, IonCardContent, IonItem, IonLabel, IonNote,
    RegionSelectComponent,
    CommonModule,
    FormsModule,
    TranslateModule,
    GoiabaHeaderComponent,
    GoiabaFooterComponent,
    TranslateComponent,
    ThemeComponent,
    IonContent,
    IonIcon
  ]
})
export class SettingsPage {
  private themeService = inject(ThemeService);
  private router = inject(Router);
}
