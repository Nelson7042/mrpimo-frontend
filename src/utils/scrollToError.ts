/**
 * Utility function to scroll to the first validation error on the page.
 * Looks for elements with data-field-id attribute that have error styling,
 * or elements containing error messages.
 */
export const scrollToFirstError = (): void => {
  // Small delay to ensure DOM has updated with error states
  setTimeout(() => {
    // First, try to find elements with error borders (border-red-500)
    const errorElements = document.querySelectorAll('[class*="border-red-500"]');
    
    if (errorElements.length > 0) {
      const firstError = errorElements[0] as HTMLElement;
      scrollToElement(firstError);
      return;
    }
    
    // Fallback: find elements with error text
    const errorTextElements = document.querySelectorAll('.text-red-500');
    
    if (errorTextElements.length > 0) {
      // Find the parent container of the first error message
      const firstErrorText = errorTextElements[0] as HTMLElement;
      const parentField = firstErrorText.closest('[data-field-id]') as HTMLElement;
      
      if (parentField) {
        scrollToElement(parentField);
      } else {
        scrollToElement(firstErrorText);
      }
    }
  }, 100);
};

/**
 * Scrolls to a specific element with smooth behavior and offset for header
 */
const scrollToElement = (element: HTMLElement): void => {
  const headerOffset = 120; // Account for fixed headers
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });

  // Focus the input element if it exists within the container
  const inputElement = element.querySelector('input, textarea, select') as HTMLElement;
  if (inputElement) {
    setTimeout(() => {
      inputElement.focus();
    }, 500); // Wait for scroll to complete
  }
};

/**
 * Scrolls to a specific field by its ID
 */
export const scrollToField = (fieldId: string): void => {
  setTimeout(() => {
    const element = document.querySelector(`[data-field-id="${fieldId}"]`) as HTMLElement;
    if (element) {
      scrollToElement(element);
    }
  }, 100);
};
