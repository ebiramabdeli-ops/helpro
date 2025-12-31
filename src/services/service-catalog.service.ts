/**
 * Service Catalog Service
 * Browse and search available services
 */

import { api } from './api-client';
import { endpoints } from '../config/api.config';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  minVerificationLevel: number;
  minTrustScore: number;
  estimatedDuration: string;
  priceRange: string;
  popular: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  requirements: string[];
  pricing: {
    min: number;
    max: number;
    unit: 'hour' | 'job';
  };
}

/**
 * Service Catalog Service
 */
export class ServiceCatalogService {
  /**
   * Get all service categories
   */
  static async getCategories(): Promise<ServiceCategory[]> {
    try {
      return await api.get<ServiceCategory[]>(endpoints.services.categories);
    } catch (error) {
      console.error('Get categories failed:', error);
      throw error;
    }
  }

  /**
   * Get services in category
   */
  static async getServices(categoryId?: string): Promise<Service[]> {
    try {
      return await api.get<Service[]>(endpoints.services.list, {
        categoryId,
      });
    } catch (error) {
      console.error('Get services failed:', error);
      throw error;
    }
  }

  /**
   * Search services
   */
  static async searchServices(query: string): Promise<Service[]> {
    try {
      return await api.get<Service[]>(endpoints.services.search, { q: query });
    } catch (error) {
      console.error('Search services failed:', error);
      throw error;
    }
  }
}

/**
 * React Hook for Service Catalog
 */
export function useServices() {
  const getCategories = async () => {
    return ServiceCatalogService.getCategories();
  };

  const getServices = async (categoryId?: string) => {
    return ServiceCatalogService.getServices(categoryId);
  };

  const searchServices = async (query: string) => {
    return ServiceCatalogService.searchServices(query);
  };

  return {
    getCategories,
    getServices,
    searchServices,
  };
}
