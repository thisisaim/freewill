import { selectCharities } from '../src/charitySelector';
import * as path from 'path';

describe('Integration Tests', () => {
  const testDataDir = path.join(__dirname, 'data');

  describe('Full charity selection workflow', () => {
    it('should complete full selection workflow successfully', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      const selectedCharities = await selectCharities(charitiesPath, profilePath);

      // Validate all requirements are met
      expect(selectedCharities).toHaveLength(12);
      
      const stateCharities = selectedCharities.filter(c => c.featured === 'STATE');
      const nationalCharities = selectedCharities.filter(c => c.featured === 'NATIONAL');
      const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');

      // Part 1 requirements
      expect(stateCharities.length).toBeLessThanOrEqual(5);
      expect(stateCharities.length + nationalCharities.length).toBe(12);
      
      // All state charities should match user's state
      stateCharities.forEach(charity => {
        expect(charity.state).toBe('NEW_YORK');
      });

      // Part 2 requirements (user has pets)
      expect(animalCharities.length).toBeGreaterThanOrEqual(4);

      // All charities should have required properties
      selectedCharities.forEach(charity => {
        expect(charity.id).toBeTruthy();
        expect(charity.name).toBeTruthy();
        expect(charity.state).toBeTruthy();
        expect(charity.category).toBeTruthy();
        expect(['NATIONAL', 'STATE', '']).toContain(charity.featured);
      });

      // No duplicate charities
      const uniqueIds = new Set(selectedCharities.map(c => c.id));
      expect(uniqueIds.size).toBe(12);
    });

    it('should work correctly for user without pets', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-no-pets.csv');

      const selectedCharities = await selectCharities(charitiesPath, profilePath);

      // Basic requirements should still be met
      expect(selectedCharities).toHaveLength(12);
      
      const stateCharities = selectedCharities.filter(c => c.featured === 'STATE');
      expect(stateCharities.length).toBeLessThanOrEqual(5);
      
      // All state charities should match user's state (CALIFORNIA)
      stateCharities.forEach(charity => {
        expect(charity.state).toBe('CALIFORNIA');
      });

      // No minimum animal charity requirement
      const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');
      // Can be any number, no minimum requirement
      expect(animalCharities.length).toBeGreaterThanOrEqual(0);
    });

    it('should demonstrate proper randomization across multiple runs', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      const runs = 10;
      const results: { stateCount: number; animalCount: number; charityIds: string[] }[] = [];

      for (let i = 0; i < runs; i++) {
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        
        results.push({
          stateCount: selectedCharities.filter(c => c.featured === 'STATE').length,
          animalCount: selectedCharities.filter(c => c.category === 'ANIMAL_RELATED').length,
          charityIds: selectedCharities.map(c => c.id).sort()
        });
      }

      // Check for variation in state charity counts
      const stateCounts = results.map(r => r.stateCount);
      const uniqueStateCounts = new Set(stateCounts);
      expect(uniqueStateCounts.size).toBeGreaterThan(1); // Should have some variation

      // Check for variation in charity selection
      const firstResult = results[0].charityIds;
      const allIdentical = results.every(result => 
        result.charityIds.length === firstResult.length &&
        result.charityIds.every((id, index) => id === firstResult[index])
      );
      expect(allIdentical).toBe(false); // Should not always select the same charities

      // All runs should meet basic constraints
      results.forEach(result => {
        expect(result.stateCount).toBeLessThanOrEqual(5);
        expect(result.animalCount).toBeGreaterThanOrEqual(4);
        expect(result.charityIds).toHaveLength(12);
      });
    });

    it('should handle boundary cases correctly', async () => {
      // Create a test case with exactly 12 charities (minimum required)
      const fs = require('fs');
      const boundaryPath = path.join(testDataDir, 'temp-boundary.csv');
      
      const csvContent = `id,name,state,category,featured
1,National 1,TEXAS,OTHER,NATIONAL
2,National 2,TEXAS,OTHER,NATIONAL
3,National 3,TEXAS,OTHER,NATIONAL
4,National 4,TEXAS,OTHER,NATIONAL
5,National 5,TEXAS,ANIMAL_RELATED,NATIONAL
6,National 6,TEXAS,ANIMAL_RELATED,NATIONAL
7,National 7,TEXAS,ANIMAL_RELATED,NATIONAL
8,National 8,TEXAS,ANIMAL_RELATED,NATIONAL
9,State 1,NEW_YORK,OTHER,STATE
10,State 2,NEW_YORK,OTHER,STATE
11,State 3,NEW_YORK,OTHER,STATE
12,State 4,NEW_YORK,ANIMAL_RELATED,STATE`;

      fs.writeFileSync(boundaryPath, csvContent);

      try {
        const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
        const selectedCharities = await selectCharities(boundaryPath, profilePath);

        // With exactly 12 charities available, expect all to be selected
        expect(selectedCharities).toHaveLength(12);
        
        // Should still meet animal charity requirement
        const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');
        expect(animalCharities.length).toBeGreaterThanOrEqual(4);
        
      } finally {
        if (fs.existsSync(boundaryPath)) {
          fs.unlinkSync(boundaryPath);
        }
      }
    });

    it('should maintain consistency across different profile types', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      
      // Test with pet owner
      const petsProfile = path.join(testDataDir, 'test-profile-with-pets.csv');
      const petsResult = await selectCharities(charitiesPath, petsProfile);
      
      // Test with non-pet owner
      const noPetsProfile = path.join(testDataDir, 'test-profile-no-pets.csv');
      const noPetsResult = await selectCharities(charitiesPath, noPetsProfile);

      // Both should return exactly 12 charities
      expect(petsResult).toHaveLength(12);
      expect(noPetsResult).toHaveLength(12);

      // Pet owner should have more animal charities
      const petsAnimalCount = petsResult.filter(c => c.category === 'ANIMAL_RELATED').length;
      const noPetsAnimalCount = noPetsResult.filter(c => c.category === 'ANIMAL_RELATED').length;
      
      expect(petsAnimalCount).toBeGreaterThanOrEqual(4);
      // No requirement for non-pet owner, could be 0 or more
      expect(noPetsAnimalCount).toBeGreaterThanOrEqual(0);

      // Both should respect state limits
      const petsStateCount = petsResult.filter(c => c.featured === 'STATE').length;
      const noPetsStateCount = noPetsResult.filter(c => c.featured === 'STATE').length;
      
      expect(petsStateCount).toBeLessThanOrEqual(5);
      expect(noPetsStateCount).toBeLessThanOrEqual(5);
    });
  });
});