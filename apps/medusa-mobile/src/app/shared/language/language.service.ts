import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageModel } from './language.model';
import { Store } from '@ngxs/store';
import { LanguageActions } from '../../store/language/language.actions';
import { LanguageState } from '../../store/language/language.state';
import { MedusaService } from '../api/medusa.service';
import { MedusaLocale, MedusaLocalesResponse } from '../interfaces';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export const SAVED_LANGUAGE = 'saved_language';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  languages: Array<LanguageModel> = new Array<LanguageModel>();

  private translate = inject(TranslateService);
  private store = inject(Store);
  private medusaService = inject(MedusaService);

  getLanguages(): any {
    this.languages = [];
    this.languages.push(
      { name: 'english', code: 'en' },
      { name: 'portuguese', code: 'pt' },
    );
    return this.languages;
  }

  /**
   * Get supported Medusa locales from state
   */
  getMedusaLocales(): MedusaLocale[] {
    return this.store.selectSnapshot(LanguageState.getSupportedLocales) || [];
  }

  /**
   * Fetch supported locales from Medusa API and store in state
   */
  fetchSupportedLocales(): Observable<MedusaLocale[]> {
    const existingLocales = this.store.selectSnapshot(LanguageState.getSupportedLocales);
    if (existingLocales && existingLocales.length > 0) {
      console.log('[LanguageService] fetchSupportedLocales - Using cached locales:', existingLocales.length);
      return of(existingLocales);
    }

    console.log('[LanguageService] fetchSupportedLocales - Fetching locales from Medusa API');
    return this.medusaService.getLocales().pipe(
      tap((response: MedusaLocalesResponse) => {
        console.log('[LanguageService] fetchSupportedLocales - Received locales:', response.locales?.length || 0);
        if (response.locales) {
          this.store.dispatch(new LanguageActions.SetSupportedLocales(response.locales));
        }
      }),
      map((response: MedusaLocalesResponse) => response.locales || []),
      catchError((error) => {
        console.error('[LanguageService] fetchSupportedLocales - Error fetching locales:', error);
        // Return empty array on error, fallback to default mapping
        return of([]);
      })
    );
  }

  /**
   * Extract language code from Medusa locale code
   * e.g., 'en-US' → 'en', 'pt-BR' → 'pt'
   */
  mapMedusaLocaleToLanguage(localeCode: string): string {
    if (!localeCode) {
      return 'en';
    }
    // Extract language part before the hyphen
    const parts = localeCode.split('-');
    return parts[0]?.toLowerCase() || 'en';
  }

  /**
   * Map language code to Medusa locale code
   * e.g., 'en' → 'en-US', 'pt' → 'pt-BR'
   * Falls back to first available locale if exact match not found
   */
  mapLanguageToMedusaLocale(languageCode: string): string | null {
    const supportedLocales = this.store.selectSnapshot(LanguageState.getSupportedLocales) || [];
    
    if (supportedLocales.length === 0) {
      // Fallback to default mapping if locales not loaded
      const defaultMapping: { [key: string]: string } = {
        'en': 'en-US',
        'pt': 'pt-BR',
      };
      return defaultMapping[languageCode] || 'en-US';
    }

    // Try to find exact match (e.g., 'en' → 'en-US')
    const exactMatch = supportedLocales.find(locale => 
      locale.code.toLowerCase().startsWith(languageCode.toLowerCase() + '-')
    );

    if (exactMatch) {
      return exactMatch.code;
    }

    // Try to find locale that starts with language code (e.g., 'en' matches 'en-US', 'en-GB')
    const partialMatch = supportedLocales.find(locale => 
      locale.code.toLowerCase().startsWith(languageCode.toLowerCase())
    );

    if (partialMatch) {
      return partialMatch.code;
    }

    // Fallback to first available locale
    const fallback = supportedLocales[0]?.code || 'en-US';
    return fallback;
  }

  /**
   * Initialize Medusa locale based on current language
   */
  async initializeMedusaLocale(): Promise<void> {
    // First, fetch supported locales
    await this.fetchSupportedLocales().toPromise();

    // Get current language
    const currentLanguage = this.store.selectSnapshot(LanguageState.getLanguage) || 
                           this.translate.currentLang || 
                           'en';

    // Map to Medusa locale
    const medusaLocale = this.mapLanguageToMedusaLocale(currentLanguage);
    
    if (medusaLocale) {
      this.store.dispatch(new LanguageActions.SetMedusaLocale(medusaLocale));
    }
  }

  async initTranslate() {
    this.translate.setDefaultLang('en');
    const savedLanguage = this.store.selectSnapshot<any>((state: any) => state.language);
    const targetLang = savedLanguage?.language || this.translate.getFallbackLang() || 'en';
    this.translate.use(targetLang);
    if (!savedLanguage?.language) {
      this.store.dispatch(new LanguageActions.SetLanguage(targetLang));
    }

    // Initialize Medusa locale after setting language
    await this.initializeMedusaLocale();
  }
}
