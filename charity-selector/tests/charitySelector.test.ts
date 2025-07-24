import { selectCharities } from '../src/charitySelector';
import * as path from 'path';

describe('charitySelector', () => {
  const testDataDir = path.join(__dirname, 'data');

  describe('selectCharities', () => {
    it('should select exactly 12 charities', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      const selectedCharities = await selectCharities(charitiesPath, profilePath);

      expect(selectedCharities).toHaveLength(12);
    });

    it('should include at least 4 animal charities when user has pets', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      const selectedCharities = await selectCharities(charitiesPath, profilePath);
      const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');

      expect(animalCharities.length).toBeGreaterThanOrEqual(4);
    });

    it('should not require animal charities when user has no pets', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-no-pets.csv');

      const selectedCharities = await selectCharities(charitiesPath, profilePath);

      // Should not fail and should return 12 charities
      expect(selectedCharities).toHaveLength(12);
    });

    it('should limit state charities to maximum of 5', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      // Run multiple times to check the constraint is always respected
      for (let i = 0; i < 10; i++) {
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        const stateCharities = selectedCharities.filter(c => c.featured === 'STATE');

        expect(stateCharities.length).toBeLessThanOrEqual(5);
      }
    });

    it('should only select state charities matching user state', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv'); // NEW_YORK user

      const selectedCharities = await selectCharities(charitiesPath, profilePath);
      const stateCharities = selectedCharities.filter(c => c.featured === 'STATE');

      stateCharities.forEach(charity => {
        expect(charity.state).toBe('NEW_YORK');
      });
    });

    it('should select different results on multiple runs (randomness test)', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      const results: string[][] = [];
      
      // Run selection 5 times
      for (let i = 0; i < 5; i++) {
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        const charityIds = selectedCharities.map(c => c.id).sort();
        results.push(charityIds);
      }

      // Check that not all results are identical (randomness)
      const firstResult = results[0];
      const allSame = results.every(result => 
        result.length === firstResult.length && 
        result.every((id, index) => id === firstResult[index])
      );

      expect(allSame).toBe(false);
    });

    it('should include both national and state charities in animal selection when possible', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      // Run multiple times to increase chance of getting both types
      let foundBothTypes = false;
      
      for (let i = 0; i < 10 && !foundBothTypes; i++) {
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');
        
        const hasNationalAnimal = animalCharities.some(c => c.featured === 'NATIONAL');
        const hasStateAnimal = animalCharities.some(c => c.featured === 'STATE');
        
        if (hasNationalAnimal && hasStateAnimal) {
          foundBothTypes = true;
        }
      }

      // This test might occasionally fail due to randomness, but should pass most of the time
      expect(foundBothTypes).toBe(true);
    });

    it('should throw error when insufficient charities available', async () => {
      // Create a temporary CSV with only 5 charities
      const fs = require('fs');
      const insufficientPath = path.join(testDataDir, 'temp-insufficient.csv');
      const csvContent = `id,name,state,category,featured
1,Charity 1,NEW_YORK,OTHER,NATIONAL
2,Charity 2,NEW_YORK,OTHER,NATIONAL
3,Charity 3,NEW_YORK,OTHER,NATIONAL
4,Charity 4,NEW_YORK,OTHER,NATIONAL
5,Charity 5,NEW_YORK,OTHER,NATIONAL`;
      
      fs.writeFileSync(insufficientPath, csvContent);

      try {
        const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
        
        await expect(selectCharities(insufficientPath, profilePath))
          .rejects
          .toThrow('Insufficient charities');
      } finally {
        // Clean up
        if (fs.existsSync(insufficientPath)) {
          fs.unlinkSync(insufficientPath);
        }
      }
    });

    it('should throw error when no profile found', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const emptyProfilePath = path.join(testDataDir, 'empty.csv');

      await expect(selectCharities(charitiesPath, emptyProfilePath))
        .rejects
        .toThrow();
    });

    it('should handle invalid charity data gracefully', async () => {
      const invalidCharitiesPath = path.join(testDataDir, 'invalid-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      // Should filter out invalid charities but still try to continue
      await expect(selectCharities(invalidCharitiesPath, profilePath))
        .rejects
        .toThrow('Insufficient charities');
    });

    it('should maintain total count even with edge cases', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      // Test multiple times to ensure consistency
      for (let i = 0; i < 20; i++) {
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        
        expect(selectedCharities).toHaveLength(12);
        
        // Verify all charities have required properties
        selectedCharities.forEach(charity => {
          expect(charity.id).toBeDefined();
          expect(charity.name).toBeDefined();
          expect(charity.category).toBeDefined();
          expect(charity.featured).toBeDefined();
        });
        
        // Verify no duplicates
        const uniqueIds = new Set(selectedCharities.map(c => c.id));
        expect(uniqueIds.size).toBe(12);
      }
    });
  });
});