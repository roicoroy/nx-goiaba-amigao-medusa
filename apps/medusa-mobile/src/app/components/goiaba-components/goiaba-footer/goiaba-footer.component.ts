import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonIcon } from '@ionic/angular/standalone';

/**
 * Goiaba Footer Component
 *
 * A reusable footer component with company info, quick links, support links, and copyright.
 * Used across all home pages for consistent footer styling and content.
 *
 * @example
 * ```html
 * <app-goiaba-footer></app-goiaba-footer>
 * ```
 */
@Component({
  selector: 'app-goiaba-footer',
  templateUrl: './goiaba-footer.component.html',
  styleUrls: ['./goiaba-footer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    IonIcon
  ]
})
export class GoiabaFooterComponent {
  currentYear = new Date().getFullYear();
}
