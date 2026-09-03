/** Sends a blur to the active element in the Document */
export function blurActiveElement(): void {
    const element =  document.activeElement;
    if (element instanceof HTMLElement) {
        element.blur();
    }
}
