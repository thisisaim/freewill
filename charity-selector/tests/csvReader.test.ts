import { readCsvFile, parseUserProfile, validateCharity } from '../src/utils/csvReader';
import { RawUserProfile, Charity } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('csvReader', () => {
  const testDataDir = path.join(__dirname, 'data');

  describe('readCsvFile', () => {
    it('should read valid CSV file successfully', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const charities = await readCsvFile<Charity>(charitiesPath);
      
      expect(charities).toHaveLength(30);
      expect(charities[0]).toEqual({
        id: '1',
        name: 'National Animal Rescue',
        state: 'CALIFORNIA',
        category: 'ANIMAL_RELATED',
        featured: 'NATIONAL'
      });
    });

    it('should read profile CSV file successfully', async () => {
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      const profiles = await readCsvFile<RawUserProfile>(profilePath);
      
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toEqual({
        id: '123',
        name: 'Test User',
        state: 'NEW_YORK',
        isMarried: 'TRUE',
        hasChildren: 'FALSE',
        hasPets: 'TRUE',
        age: '35'
      });
    });

    it('should reject when file does not exist', async () => {
      const nonExistentPath = path.join(testDataDir, 'nonexistent.csv');
      
      await expect(readCsvFile(nonExistentPath))
        .rejects
        .toThrow('CSV file not found');
    });

    it('should reject when file is empty', async () => {
      const emptyPath = path.join(testDataDir, 'empty.csv');
      
      await expect(readCsvFile(emptyPath))
        .rejects
        .toThrow('CSV file is empty');
    });

    it('should handle CSV parsing errors gracefully', async () => {
      // Create a temporary invalid CSV file
      const invalidPath = path.join(testDataDir, 'temp-invalid.csv');
      fs.writeFileSync(invalidPath, 'invalid\ncsv\ndata\nwith\nmissing\ncommas');
      
      try {
        const result = await readCsvFile(invalidPath);
        // Should still succeed but with parsed data
        expect(Array.isArray(result)).toBe(true);
      } finally {
        // Clean up
        if (fs.existsSync(invalidPath)) {
          fs.unlinkSync(invalidPath);
        }
      }
    });
  });

  describe('parseUserProfile', () => {
    it('should parse valid user profile correctly', () => {
      const rawProfile: RawUserProfile = {
        id: '123',
        name: 'John Doe',
        state: 'NEW_YORK',
        isMarried: 'TRUE',
        hasChildren: 'FALSE',
        hasPets: 'true',
        age: '35'
      };

      const parsed = parseUserProfile(rawProfile);

      expect(parsed).toEqual({
        id: '123',
        name: 'John Doe',
        state: 'NEW_YORK',
        isMarried: true,
        hasChildren: false,
        hasPets: true,
        age: 35
      });
    });

    it('should handle false values correctly', () => {
      const rawProfile: RawUserProfile = {
        id: '456',
        name: 'Jane Smith',
        state: 'CALIFORNIA',
        isMarried: 'FALSE',
        hasChildren: 'false',
        hasPets: 'False',
        age: '28'
      };

      const parsed = parseUserProfile(rawProfile);

      expect(parsed.isMarried).toBe(false);
      expect(parsed.hasChildren).toBe(false);
      expect(parsed.hasPets).toBe(false);
    });

    it('should handle invalid age gracefully', () => {
      const rawProfile: RawUserProfile = {
        id: '789',
        name: 'Invalid Age',
        state: 'TEXAS',
        isMarried: 'TRUE',
        hasChildren: 'TRUE',
        hasPets: 'FALSE',
        age: 'not-a-number'
      };

      const parsed = parseUserProfile(rawProfile);
      expect(parsed.age).toBe(0);
    });

    it('should handle undefined/null boolean values', () => {
      const rawProfile: RawUserProfile = {
        id: '999',
        name: 'Test User',
        state: 'FLORIDA',
        isMarried: undefined as any,
        hasChildren: null as any,
        hasPets: '',
        age: '30'
      };

      const parsed = parseUserProfile(rawProfile);
      
      expect(parsed.isMarried).toBe(false);
      expect(parsed.hasChildren).toBe(false);
      expect(parsed.hasPets).toBe(false);
    });

    it('should throw error for invalid profile data', () => {
      const invalidProfile = null as any;
      
      expect(() => parseUserProfile(invalidProfile))
        .toThrow('Failed to parse user profile');
    });
  });

  describe('validateCharity', () => {
    it('should validate correct charity', () => {
      const charity: Charity = {
        id: '1',
        name: 'Test Charity',
        state: 'NEW_YORK',
        category: 'ANIMAL_RELATED',
        featured: 'NATIONAL'
      };

      expect(validateCharity(charity)).toBe(true);
    });

    it('should reject charity without id', () => {
      const charity: Charity = {
        id: '',
        name: 'Test Charity',
        state: 'NEW_YORK',
        category: 'ANIMAL_RELATED',
        featured: 'NATIONAL'
      };

      expect(validateCharity(charity)).toBe(false);
    });

    it('should reject charity without name', () => {
      const charity: Charity = {
        id: '1',
        name: '',
        state: 'NEW_YORK',
        category: 'ANIMAL_RELATED',
        featured: 'NATIONAL'
      };

      expect(validateCharity(charity)).toBe(false);
    });

    it('should reject charity with invalid featured value', () => {
      const charity: Charity = {
        id: '1',
        name: 'Test Charity',
        state: 'NEW_YORK',
        category: 'ANIMAL_RELATED',
        featured: 'INVALID' as any
      };

      expect(validateCharity(charity)).toBe(false);
    });

    it('should reject state charity without state', () => {
      const charity: Charity = {
        id: '1',
        name: 'Test Charity',
        state: '',
        category: 'ANIMAL_RELATED',
        featured: 'STATE'
      };

      expect(validateCharity(charity)).toBe(false);
    });

    it('should accept charity with empty featured value', () => {
      const charity: Charity = {
        id: '1',
        name: 'Test Charity',
        state: 'NEW_YORK',
        category: 'ANIMAL_RELATED',
        featured: ''
      };

      expect(validateCharity(charity)).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      const invalidCharity = null as any;
      
      expect(validateCharity(invalidCharity)).toBe(false);
    });
  });
});