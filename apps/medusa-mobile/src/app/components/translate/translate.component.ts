import { Component, inject, OnDestroy, OnInit, Input, signal, computed } from '@angular/core';
import { AlertController, IonButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { LanguageActions } from '../../store/language/language.actions';
import { Subject } from 'rxjs';
import { LanguageService } from 'src/app/shared/language/language.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonLabel,
    TranslateModule
  ]
})
export class TranslateComponent implements OnInit, OnDestroy {
  @Input() showFlag: boolean = true;
  @Input() showLabel: boolean = true;
  @Input() showChevron: boolean = true;
  @Input() customClass: string = '';
  @Input() labelClass: string = 'text-base font-medium text-neutral-900';
  @Input() slot: string = 'end';

  private readonly ngUnsubscribe = new Subject();

  public translate = inject(TranslateService);
  private languageService = inject(LanguageService);
  private alertController = inject(AlertController);
  private store = inject(Store);

  currentMedusaLocale$ = this.store.select((state: any) => state.language?.medusaLocale);
  currentLanguage$ = this.store.select((state: any) => state.language?.language);

  // Flag emoji mapping for common locales/languages
  private readonly flagEmojiMap: { [key: string]: string } = {
    'en': '🇬🇧',
    'en-US': '🇺🇸',
    'en-GB': '🇬🇧',
    'en-CA': '🇨🇦',
    'en-AU': '🇦🇺',
    'pt': '🇧🇷',
    'pt-BR': '🇧🇷',
    'pt-PT': '🇵🇹',
    'es': '🇪🇸',
    'es-ES': '🇪🇸',
    'es-MX': '🇲🇽',
    'fr': '🇫🇷',
    'fr-FR': '🇫🇷',
    'fr-CA': '🇨🇦',
    'de': '🇩🇪',
    'de-DE': '🇩🇪',
    'it': '🇮🇹',
    'it-IT': '🇮🇹',
    'ja': '🇯🇵',
    'ja-JP': '🇯🇵',
    'zh': '🇨🇳',
    'zh-CN': '🇨🇳',
    'zh-TW': '🇹🇼',
    'ko': '🇰🇷',
    'ko-KR': '🇰🇷',
    'ru': '🇷🇺',
    'ru-RU': '🇷🇺',
    'nl': '🇳🇱',
    'nl-NL': '🇳🇱',
    'pl': '🇵🇱',
    'pl-PL': '🇵🇱',
    'sv': '🇸🇪',
    'sv-SE': '🇸🇪',
    'da': '🇩🇰',
    'da-DK': '🇩🇰',
    'fi': '🇫🇮',
    'fi-FI': '🇫🇮',
    'no': '🇳🇴',
    'no-NO': '🇳🇴',
    'tr': '🇹🇷',
    'tr-TR': '🇹🇷',
    'ar': '🇸🇦',
    'ar-SA': '🇸🇦',
    'hi': '🇮🇳',
    'hi-IN': '🇮🇳',
  };

  ngOnInit(): void {
    // Translations are loaded via TranslateService automatically
    // Store state is managed by LanguageService.initTranslate() in app.component
  }

  /**
   * Get the flag emoji for the current locale/language
   */
  getCurrentFlag(): string {
    // Try to get flag from current Medusa locale first
    const currentLocale = this.store.selectSnapshot((state: any) => state.language?.medusaLocale);
    if (currentLocale && this.flagEmojiMap[currentLocale]) {
      return this.flagEmojiMap[currentLocale];
    }

    // Fallback to language code
    const currentLang = this.translate.currentLang || 'en';
    if (this.flagEmojiMap[currentLang]) {
      return this.flagEmojiMap[currentLang];
    }

    // Extract language code from locale (e.g., 'en-US' → 'en')
    if (currentLocale) {
      const langCode = this.languageService.mapMedusaLocaleToLanguage(currentLocale);
      if (this.flagEmojiMap[langCode]) {
        return this.flagEmojiMap[langCode];
      }
    }

    // Default fallback
    return '🌐';
  }

  /**
   * Get the display name for the current locale/language
   */
  getCurrentLocaleName(): string {
    const currentLocale = this.store.selectSnapshot((state: any) => state.language?.medusaLocale);
    if (currentLocale) {
      const supportedLocales = this.languageService.getMedusaLocales();
      const locale = supportedLocales.find((l: any) => l.code === currentLocale);
      if (locale && locale.name) {
        return locale.name;
      }
      // If no name, format the locale code nicely
      return this.formatLocaleCode(currentLocale);
    }
    // Fallback to language name
    const currentLang = this.translate.currentLang || 'en';
    const languages = this.languageService.getLanguages();
    const lang = languages.find((l: any) => l.code === currentLang);
    return lang ? this.translate.instant(lang.name) : currentLang.toUpperCase();
  }

  /**
   * Format locale code for display (e.g., 'en-US' → 'English (US)')
   */
  private formatLocaleCode(localeCode: string): string {
    if (!localeCode) return 'Unknown';
    
    const parts = localeCode.split('-');
    const langCode = parts[0]?.toUpperCase() || '';
    const countryCode = parts[1]?.toUpperCase() || '';
    
    const langNames: { [key: string]: string } = {
      'EN': 'English',
      'PT': 'Portuguese',
      'ES': 'Spanish',
      'FR': 'French',
      'DE': 'German',
      'IT': 'Italian',
      'JA': 'Japanese',
      'ZH': 'Chinese',
      'KO': 'Korean',
      'RU': 'Russian',
      'NL': 'Dutch',
      'PL': 'Polish',
      'SV': 'Swedish',
      'DA': 'Danish',
      'FI': 'Finnish',
      'NO': 'Norwegian',
      'TR': 'Turkish',
      'AR': 'Arabic',
      'HI': 'Hindi',
    };

    const langName = langNames[langCode] || langCode;
    return countryCode ? `${langName} (${countryCode})` : langName;
  }

  public async openLanguageChooser() {
    // Get supported locales from Medusa (via state)
    const supportedLocales = this.languageService.getMedusaLocales();
    
    // If no locales loaded yet, fetch them
    if (!supportedLocales || supportedLocales.length === 0) {
      try {
        await this.languageService.fetchSupportedLocales().toPromise();
        // Retry getting locales after fetch
        const refreshedLocales = this.languageService.getMedusaLocales();
        if (refreshedLocales && refreshedLocales.length > 0) {
          this.showLocaleChooser(refreshedLocales);
          return;
        }
      } catch (error) {
        console.error('[TranslateComponent] openLanguageChooser - Error fetching locales:', error);
        // Fallback to default languages if fetch fails
        this.showFallbackLanguageChooser();
        return;
      }
    }

    this.showLocaleChooser(supportedLocales);
  }

  private async showLocaleChooser(locales: any[]) {
    const currentLang = this.translate.currentLang || 'en';
    const currentLocale = this.store.selectSnapshot((state: any) => state.language?.medusaLocale);

    // Preferred locale mappings (most common variants)
    const preferredLocales: { [key: string]: string } = {
      'en': 'en-US',  // Prefer en-US for English
      'pt': 'pt-BR',  // Prefer pt-BR for Portuguese
      'es': 'es-ES',  // Prefer es-ES for Spanish
      'fr': 'fr-FR',  // Prefer fr-FR for French
      'de': 'de-DE',  // Prefer de-DE for German
    };

    // Group locales by language code (e.g., 'en-US', 'en-GB' → 'en')
    // This prevents duplicate entries for the same language
    const localesByLanguage = new Map<string, any[]>();
    
    locales.forEach((locale: any) => {
      const languageCode = this.languageService.mapMedusaLocaleToLanguage(locale.code);
      if (!localesByLanguage.has(languageCode)) {
        localesByLanguage.set(languageCode, []);
      }
      localesByLanguage.get(languageCode)!.push(locale);
    });

    // Create inputs: one per language, using the preferred locale for each language
    const localeInputs: Array<{
      name: string;
      type: 'radio';
      label: string;
      value: string;
      checked: boolean;
    }> = [];

    localesByLanguage.forEach((localeGroup: any[], languageCode: string) => {
      // Determine which locale to use for this language group
      let selectedLocale: any;
      
      // First, check if current locale is in this group
      selectedLocale = localeGroup.find(l => l.code === currentLocale);
      
      if (!selectedLocale) {
        // Try to find the preferred locale for this language (e.g., en-US for en, pt-BR for pt)
        const preferredLocaleCode = preferredLocales[languageCode];
        if (preferredLocaleCode) {
          selectedLocale = localeGroup.find(l => l.code === preferredLocaleCode);
        }
      }
      
      // Fallback: use locale matching current language, or first available
      if (!selectedLocale) {
        selectedLocale = localeGroup.find(l => 
          this.languageService.mapMedusaLocaleToLanguage(l.code) === currentLang
        ) || localeGroup[0];
      }

      const localeCode = selectedLocale.code;
      
      // Get language name from translation files (e.g., 'english' from en.json)
      const languages = this.languageService.getLanguages();
      const lang = languages.find((l: any) => l.code === languageCode);
      const displayName = lang 
        ? this.translate.instant(lang.name) 
        : (selectedLocale.name || this.formatLocaleCode(localeCode));

      localeInputs.push({
        name: 'locale',
        type: 'radio' as const,
        label: displayName,
        value: localeCode,
        checked: localeCode === currentLocale || languageCode === currentLang
      });
    });

    // Sort by language code for consistent ordering
    localeInputs.sort((a, b) => {
      const langA = this.languageService.mapMedusaLocaleToLanguage(a.value);
      const langB = this.languageService.mapMedusaLocaleToLanguage(b.value);
      return langA.localeCompare(langB);
    });

    const alert = await this.alertController.create({
      header: this.translate.instant('select_language') || 'Select Language',
      inputs: localeInputs,
      cssClass: 'language-alert',
      buttons: [
        {
          text: this.translate.instant('cancel') || 'Cancel',
          role: 'cancel',
          cssClass: 'translate-alert',
          handler: () => { }
        },
        {
          text: this.translate.instant('ok') || 'OK',
          handler: (selectedLocaleCode: string) => {
            if (selectedLocaleCode) {
              // Extract language code from locale (e.g., 'en-US' → 'en')
              const languageCode = this.languageService.mapMedusaLocaleToLanguage(selectedLocaleCode);
              
              // Update ngx-translate language
              this.translate.use(languageCode);
              
              // Update language state
              this.store.dispatch(new LanguageActions.SetLanguage(languageCode));
              
              // Update Medusa locale state
              this.store.dispatch(new LanguageActions.SetMedusaLocale(selectedLocaleCode));
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showFallbackLanguageChooser() {
    // Fallback to original behavior if locales not available
    const availableLanguages = this.languageService.getLanguages()
      .map((item: any) => ({
        name: item.name,
        type: 'radio',
        label: this.translate.instant(item.name),
        value: item.code,
        checked: item.code === this.translate.currentLang
      })
      );

    const alert = await this.alertController.create({
      header: this.translate.instant('select_language') || 'Select Language',
      inputs: availableLanguages,
      cssClass: 'language-alert',
      buttons: [
        {
          text: this.translate.instant('cancel') || 'Cancel',
          role: 'cancel',
          cssClass: 'translate-alert',
          handler: () => { }
        },
        {
          text: this.translate.instant('ok') || 'OK',
          handler: (data) => {
            if (data) {
              this.translate.use(data);
              this.store.dispatch(new LanguageActions.SetLanguage(data));
              
              // Map to Medusa locale
              const medusaLocale = this.languageService.mapLanguageToMedusaLocale(data);
              if (medusaLocale) {
                this.store.dispatch(new LanguageActions.SetMedusaLocale(medusaLocale));
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
