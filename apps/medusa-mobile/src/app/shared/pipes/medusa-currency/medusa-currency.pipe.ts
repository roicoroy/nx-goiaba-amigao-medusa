import { Pipe, PipeTransform, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { RegionsState } from 'src/app/store/regions/regions.state';

@Pipe({
    name: 'medusaCurrency',
    standalone: true,
})
export class MedusaCurrency implements PipeTransform {
    private store = inject(Store);

    /**
     * Transform Medusa price (in cents) to formatted currency string
     * @param value - Price in cents (e.g., 1000 = $10.00)
     * @param currency_code - Optional currency code override
     * @param locale - Optional locale override
     * @returns Formatted currency string
     */
    transform(value: any, currency_code?: string, locale?: string): string {
        // Handle null, undefined, or invalid values
        if (value === null || value === undefined || isNaN(Number(value))) {
            return 'Price not available';
        }

        const numericValue = Number(value);

        // Get the current selected region
        const currentRegion = this.store.selectSnapshot(RegionsState.getDefaultRegion);
        const regionCurrency = currentRegion?.currency_code || 'USD';

        // Use the provided currency_code if available, otherwise use the region's currency
        // Normalize to uppercase for consistency (ISO currency codes should be uppercase)
        const rawCurrency = currency_code || regionCurrency;
        const currencyToUse = (rawCurrency && typeof rawCurrency === 'string') 
            ? rawCurrency.toUpperCase().trim() 
            : 'USD';

        // Get appropriate locale for the currency
        const localeToUse = locale || this.getCurrencyLocale(currencyToUse);

        try {
            // Determine if the value is already in base currency or needs conversion from cents
            // Medusa sometimes returns prices in cents (e.g., 1000 = 10.00) and sometimes in base currency (e.g., 10.55)
            // Heuristic:
            // - If value has decimal places (e.g., 10.55), it's already in base currency
            // - If value is whole number and >= 100, assume it's in cents
            // - If value is whole number and < 100, assume it's already in base currency (to avoid 10 becoming 0.10)
            const isDecimal = numericValue % 1 !== 0;
            const isWholeNumber = numericValue % 1 === 0;
            
            let actualPrice: number;
            if (isDecimal) {
                // Has decimal places, already in base currency (e.g., 10.55)
                actualPrice = numericValue;
            } else if (isWholeNumber && numericValue >= 100) {
                // Whole number >= 100, likely in cents (e.g., 1000 = 10.00)
                actualPrice = numericValue / 100;
            } else {
                // Whole number < 100, assume already in base currency (e.g., 10 = 10.00, not 0.10)
                actualPrice = numericValue;
            }

            // Format using Intl.NumberFormat for proper localization
            const formatter = new Intl.NumberFormat(localeToUse, {
                style: 'currency',
                currency: currencyToUse,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            return formatter.format(actualPrice);
        } catch (error) {
            console.warn('Error formatting currency:', error, { value, currency_code, currencyToUse });
            // Fallback to simple format
            const fallbackPrice = numericValue >= 100 && numericValue % 1 === 0 
                ? numericValue / 100 
                : numericValue;
            return `${this.getCurrencySymbol(currencyToUse)}${fallbackPrice.toFixed(2)}`;
        }
    }

    /**
     * Get appropriate locale for currency formatting
     */
    private getCurrencyLocale(currency: string): string {
        const currencyLocaleMap: { [key: string]: string } = {
            'USD': 'en-US',
            'EUR': 'de-DE',
            'GBP': 'en-GB',
            'JPY': 'ja-JP',
            'CAD': 'en-CA',
            'AUD': 'en-AU',
            'BRL': 'pt-BR',
            'INR': 'en-IN',
            'CNY': 'zh-CN',
            'KRW': 'ko-KR',
            'MXN': 'es-MX',
            'CHF': 'de-CH',
            'SEK': 'sv-SE',
            'NOK': 'nb-NO',
            'DKK': 'da-DK'
        };

        return currencyLocaleMap[currency.toUpperCase()] || 'en-US';
    }

    /**
     * Get currency symbol as fallback
     */
    private getCurrencySymbol(currency: string): string {
        const symbolMap: { [key: string]: string } = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'BRL': 'R$',
            'INR': '₹',
            'CNY': '¥',
            'KRW': '₩',
            'MXN': '$',
            'CHF': 'CHF',
            'SEK': 'kr',
            'NOK': 'kr',
            'DKK': 'kr'
        };

        return symbolMap[currency.toUpperCase()] || currency.toUpperCase() + ' ';
    }
}
