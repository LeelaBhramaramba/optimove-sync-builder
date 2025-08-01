import {
  getMockBrands,
  getMockProducts,
  getMockMapping,
  getMockMailingItems,
  getMockLanguages,
  mockTemplateIdExists,
  exportToOptimove as mockExportToOptimove
} from '@/mock/optimoveMockApi';

import { Brand, Product, Mapping, MailingItem, Language, ExportResponse } from '@/types/optimove';

// API Service Layer - Easy to swap for real APIs
export class OptimoveApiService {

  private baseUrl = 'https://cms.local.env.works/sitecore/api/email-export';
  // In production, replace these with real API calls
   async getBrands(): Promise<string[]> {
  const fullUrl = `${this.baseUrl}/optimove-mapping/brands`;

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch brands: ${response.statusText}`);
  }

  return await response.json();
}


 async getProducts(brandCode: string): Promise<Product[]> {
  const url = `${this.baseUrl}/optimove-mapping/products?brand=${encodeURIComponent(brandCode)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Required if Sitecore uses cookie-based auth
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const productCodes: string[] = await response.json();

  const products: Product[] = productCodes.map(code => ({
    code,
    name: code,
    description: '', // Optional or use logic to set meaningful text
  }));

  return products;
}

  async getMapping(brandCode: string, productCode: string): Promise<Mapping | null> {
  const endpoint = `/optimove-mapping?brand=${encodeURIComponent(brandCode)}&product=${encodeURIComponent(productCode)}`;

  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      console.error(`[API] Failed to fetch mapping. Status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    const mapping: Mapping = {
      brandCode,
      productCode,
      mailingSite: data.MailingSite,
      replyTo: data.ReplyTo,
      fromAddress: data.FromAddress,
      optimoveBrandId: data.OptimoveBrandId,
      folderId: data.DefaultOptimoveFolderId,
      emailIds: [] // Or fetch/compute if needed
    };

    return mapping;

  } catch (error) {
    console.error(`[API] Exception while fetching mapping:`, error);
    return null;
  }
}


 async getMailingItems(mailingSite: string): Promise<MailingItem[]> {
  const endpoint = `/mailing-items?mailingSite=${encodeURIComponent(mailingSite)}`;

  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      console.error(`[API] Failed to fetch mailing items. Status: ${response.status}`);
      return [];
    }

    const data = await response.json();

    const mailingItems: MailingItem[] = data.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      mailingSite: mailingSite,          // Populate from param
      templateId: undefined,             // Not provided by API
      path: '',                          // Not provided by API
      lastModified: item.LastModified,
      isActive: true                     // Assuming true by default
    }));

    return mailingItems;
  } catch (error) {
    console.error(`[API] Exception while fetching mailing items:`, error);
    return [];
  }
}

 async getLanguages(itemId: string): Promise<Language[]> {
  const endpoint = `/mailing-item/languages?itemId=${encodeURIComponent(itemId)}`;

  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      console.error(`[API] Failed to fetch languages. Status: ${response.status}`);
      return [];
    }

    const data = await response.json();

    const languages: Language[] = data.map((lang: any, index: number) => ({
      code: lang.Code,
      name: lang.Name,
      displayName: lang.DisplayName,
      isDefault: index === 0 // You can use some logic to define default, here it's the first one
    }));

    return languages;
  } catch (error) {
    console.error(`[API] Exception while fetching languages:`, error);
    return [];
  }
}


  async templateExists(itemId: string, languageCode: string): Promise<boolean> {
    return mockTemplateIdExists(itemId, languageCode);
  }

  async exportToOptimove(itemId: string, languageCode: string): Promise<ExportResponse> {
    return mockExportToOptimove(itemId, languageCode);
  }

  // Utility method to construct preview URL
  constructPreviewUrl(itemId: string, languageCode: string, sitecoreHost: string = 'https://cms.local.env.works'): string {
    return `${sitecoreHost}/?sc_itemid=${itemId}&sc_lang=${languageCode}&sc_mode=preview&mailExportMode=true`;
  }
}

// Singleton instance
export const optimoveApi = new OptimoveApiService();