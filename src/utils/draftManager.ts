import { ProductFormData } from './productFormValidation';

export interface DraftData {
  draftId: string;
  productDetails: Partial<ProductFormData>;
  step: number;
  title?: string;
  completionPercentage: number;
  lastUpdated: Date;
  savedOnMobile: boolean;
  savedToServer?: boolean;
}

export class DraftManager {
  private static readonly STORAGE_KEY = 'product_drafts';
  private static readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private static autoSaveTimer: NodeJS.Timeout | null = null;

  // Generate unique draft ID
  static generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate completion percentage
  static calculateCompletionPercentage(data: Partial<ProductFormData>): number {
    const requiredFields = [
      'name', 'brand', 'description', 'condition',
      'category.main', 'country', 'images', 'variants',
      'shipping.weight', 'inventory.listing.type'
    ];

    let completed = 0;
    requiredFields.forEach(field => {
      if (this.getNestedValue(data, field)) {
        completed++;
      }
    });

    // Additional checks for complex fields
    if (data.variants && data.variants.length > 0) {
      const hasValidVariant = data.variants.some(v => 
        v.options && v.options.length > 0 && 
        v.options.some(o => o.price && o.quantity !== undefined)
      );
      if (hasValidVariant) completed++;
    }

    if (data.specifications && data.specifications.length > 0) {
      completed++;
    }

    return Math.round((completed / (requiredFields.length + 2)) * 100);
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Generate draft title
  static generateDraftTitle(data: Partial<ProductFormData>): string {
    if (data.name) {
      return data.name.length > 30 ? `${data.name.substring(0, 30)}...` : data.name;
    }
    if (data.brand) {
      return `${data.brand} Product`;
    }
    return 'Untitled Product';
  }

  // Save draft locally (fallback)
  static saveLocalDraft(draft: DraftData): void {
    try {
      const existingDrafts = this.getLocalDrafts();
      const updatedDrafts = existingDrafts.filter(d => d.draftId !== draft.draftId);
      updatedDrafts.push(draft);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Failed to save draft locally:', error);
    }
  }

  // Mark draft as saved to server
  static markDraftSavedToServer(draftId: string): void {
    try {
      const existingDrafts = this.getLocalDrafts();
      const draftIndex = existingDrafts.findIndex(d => d.draftId === draftId);
      
      if (draftIndex !== -1) {
        existingDrafts[draftIndex].savedToServer = true;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingDrafts));
      }
    } catch (error) {
      console.error('Failed to mark draft as saved to server:', error);
    }
  }

  // Get local drafts
  static getLocalDrafts(): DraftData[] {
    try {
      const drafts = localStorage.getItem(this.STORAGE_KEY);
      return drafts ? JSON.parse(drafts) : [];
    } catch (error) {
      console.error('Failed to get local drafts:', error);
      return [];
    }
  }

  // Remove local draft
  static removeLocalDraft(draftId: string): void {
    try {
      const existingDrafts = this.getLocalDrafts();
      const updatedDrafts = existingDrafts.filter(d => d.draftId !== draftId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Failed to remove local draft:', error);
    }
  }

  // Prepare draft for saving
  static prepareDraftData(
    draftId: string,
    productDetails: Partial<ProductFormData>,
    currentStep: number,
    savedOnMobile: boolean = false,
    savedToServer: boolean = false
  ): DraftData {
    return {
      draftId,
      productDetails,
      step: currentStep,
      title: this.generateDraftTitle(productDetails),
      completionPercentage: this.calculateCompletionPercentage(productDetails),
      lastUpdated: new Date(),
      savedOnMobile,
      savedToServer
    };
  }

  // Auto-save functionality
  static startAutoSave(
    draftId: string,
    getCurrentData: () => Partial<ProductFormData>,
    getCurrentStep: () => number,
    saveDraftFn: (draft: any) => Promise<void>
  ): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(async () => {
      try {
        const currentData = getCurrentData();
        const currentStep = getCurrentStep();
        
        // Only auto-save if there's meaningful data
        if (currentData.name || currentData.description || currentData.brand) {
          const draftData = this.prepareDraftData(draftId, currentData, currentStep);
          
          // Save locally first as backup
          this.saveLocalDraft(draftData);
          
          // Then save to server
          await saveDraftFn(draftData);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  static stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Validate draft data before saving
  static validateDraftData(data: Partial<ProductFormData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for potential data corruption
    if (data.variants) {
      data.variants.forEach((variant, index) => {
        if (variant.options) {
          variant.options.forEach((option, optionIndex) => {
            if (option.price && (isNaN(option.price) || option.price < 0)) {
              errors.push(`Invalid price in variant ${index}, option ${optionIndex}`);
            }
            if (option.quantity !== undefined && (isNaN(option.quantity) || option.quantity < 0)) {
              errors.push(`Invalid quantity in variant ${index}, option ${optionIndex}`);
            }
          });
        }
      });
    }

    if (data.shipping?.weight && (isNaN(data.shipping.weight) || data.shipping.weight < 0)) {
      errors.push('Invalid shipping weight');
    }

    if (data.inventory?.listing?.type === 'auction' && data.inventory.listing.auction) {
      const auction = data.inventory.listing.auction;
      if (auction.startBidPrice && (isNaN(auction.startBidPrice) || auction.startBidPrice < 0)) {
        errors.push('Invalid auction start bid price');
      }
      if (auction.reservePrice && (isNaN(auction.reservePrice) || auction.reservePrice < 0)) {
        errors.push('Invalid auction reserve price');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Merge draft data with form data (for loading drafts)
  static mergeDraftData(
    formData: Partial<ProductFormData>,
    draftData: Partial<ProductFormData>
  ): Partial<ProductFormData> {
    const merged = { ...formData };

    // Merge simple fields
    Object.keys(draftData).forEach(key => {
      if (draftData[key as keyof ProductFormData] !== undefined) {
        (merged as any)[key] = draftData[key as keyof ProductFormData];
      }
    });

    // Special handling for nested objects
    if (draftData.category) {
      merged.category = { ...merged.category, ...draftData.category };
    }

    if (draftData.inventory) {
      merged.inventory = {
        ...merged.inventory,
        ...draftData.inventory,
        listing: {
          ...merged.inventory?.listing,
          ...draftData.inventory.listing
        }
      };
    }

    if (draftData.shipping) {
      merged.shipping = {
        ...merged.shipping,
        ...draftData.shipping,
        dimensions: {
          ...merged.shipping?.dimensions,
          ...draftData.shipping.dimensions
        }
      };
    }

    return merged;
  }
}