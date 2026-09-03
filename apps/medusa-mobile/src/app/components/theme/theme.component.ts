import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../shared/theme/theme.service';
import { GoiabaSwapComponent } from '../goiaba-swap/goiaba-swap.component';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    GoiabaSwapComponent
  ]
})
export class ThemeComponent {

  private theme = inject(ThemeService);

  appDarkMode = this.theme.isDarkMode;

  /**
   * Handle swap change event from goiaba-swap component
   */
  onSwapChange(checked: boolean) {
    this.theme.changeTheme({ detail: { checked } });
  }
}
