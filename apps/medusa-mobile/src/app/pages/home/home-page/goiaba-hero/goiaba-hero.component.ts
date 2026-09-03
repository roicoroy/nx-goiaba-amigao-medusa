import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonIcon } from '@ionic/angular/standalone';
import { Goiaba3DBannerComponent } from '../../../../components/goiaba-components/goiaba-3d-banner/goiaba-3d-banner.component';
import { Goiaba3DLogoComponent } from "src/app/components/goiaba-components/goiaba-3d-logo/goiaba-3d-logo";

@Component({
  selector: 'app-goiaba-hero',
  templateUrl: './goiaba-hero.component.html',
  styleUrls: ['./goiaba-hero.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, IonIcon, Goiaba3DBannerComponent, Goiaba3DLogoComponent]
})
export class GoiabaHeroComponent {
  @Output() shopNowClick = new EventEmitter<void>();

  onShopNowClick(): void {
    this.shopNowClick.emit();
  }
}
