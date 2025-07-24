export interface Charity {
  id: string;
  name: string;
  state: string;
  category: string;
  featured: 'NATIONAL' | 'STATE' | '';
}

export interface RawUserProfile {
  id: string;
  name: string;
  state: string;
  isMarried: string;
  hasChildren: string;
  hasPets: string;
  age: string;
}

export interface UserProfile {
  id: string;
  name: string;
  state: string;
  isMarried: boolean;
  hasChildren: boolean;
  hasPets: boolean;
  age: number;
}

export interface SelectionConstraints {
  totalCharities: number;
  maxStateCharities: number;
  minAnimalCharitiesIfPets: number;
}

export interface TailoringRule {
  applies: (profile: UserProfile) => boolean;
  getMinCount: (profile: UserProfile) => number;
  getCategory: () => string;
}
