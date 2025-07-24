import { selectCharities } from '../src/charitySelector';
import * as path from 'path';
import * as fs from 'fs';

describe('Edge Cases and Error Handling', () => {
  const testDataDir = path.join(__dirname, 'data');
  
  afterEach(() => {
    // Clean up any temporary files
    const tempFiles = [
      'temp-no-animals.csv',
      'temp-no-state-match.csv',
      'temp-all-state.csv',
      'temp-large-dataset.csv',
      'temp-malformed.csv'
    ];
    
    tempFiles.forEach(fileName => {
      const filePath = path.join(testDataDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Data Availability Edge Cases', () => {
    it('should handle case with no animal charities available', async () => {
      const noAnimalsPath = path.join(testDataDir, 'temp-no-animals.csv');
      const csvContent = `id,name,state,category,featured
1,National Health,TEXAS,HEALTH_CARE,NATIONAL
2,National Education,TEXAS,EDUCATION,NATIONAL
3,NY Health,NEW_YORK,HEALTH_CARE,STATE
4,NY Education,NEW_YORK,EDUCATION,STATE
5,National Arts,CALIFORNIA,ARTS_CULTURE_HUMANITIES,NATIONAL
6,National Environment,FLORIDA,ENVIRONMENT,NATIONAL
7,National Research,VIRGINIA,OTHER,NATIONAL
8,NY Community,NEW_YORK,HUMAN_SERVICES,STATE
9,National Veterans,NEVADA,OTHER,NATIONAL
10,NY Mental Health,NEW_YORK,MENTAL_HEALTH_CRISIS_INTERVENTION,STATE
11,National Food Bank,OREGON,HUMAN_SERVICES,NATIONAL
12,NY Disaster Relief,NEW_YORK,HUMAN_SERVICES,STATE
13,National Science,WASHINGTON,EDUCATION,NATIONAL
14,National Music,GEORGIA,ARTS_CULTURE_HUMANITIES,NATIONAL
15,NY Sports,NEW_YORK,OTHER,STATE`;

      fs.writeFileSync(noAnimalsPath, csvContent);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      
      // Should still complete but won't meet animal requirement
      const selectedCharities = await selectCharities(noAnimalsPath, profilePath);
      
      // With only 15 total charities (9 national + 6 state for NY), expect all available
      expect(selectedCharities.length).toBeLessThanOrEqual(12);
      
      const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');
      expect(animalCharities.length).toBe(0); // No animal charities available
    });

    it('should handle case with no state match', async () => {
      const noStateMatchPath = path.join(testDataDir, 'temp-no-state-match.csv');
      const csvContent = `id,name,state,category,featured
${Array.from({ length: 15 }, (_, i) => `${i + 1},National Charity ${i + 1},TEXAS,OTHER,NATIONAL`).join('\n')}`;

      fs.writeFileSync(noStateMatchPath, csvContent);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv'); // NEW_YORK user
      
      const selectedCharities = await selectCharities(noStateMatchPath, profilePath);
      
      expect(selectedCharities).toHaveLength(12);
      
      // All should be national since no state match
      const stateCharities = selectedCharities.filter(c => c.featured === 'STATE');
      expect(stateCharities.length).toBe(0);
      
      const nationalCharities = selectedCharities.filter(c => c.featured === 'NATIONAL');
      expect(nationalCharities.length).toBe(12);
    });

    it('should handle case with only state charities available', async () => {
      const allStatePath = path.join(testDataDir, 'temp-all-state.csv');
      const csvContent = `id,name,state,category,featured
${Array.from({ length: 12 }, (_, i) => `${i + 1},NY Charity ${i + 1},NEW_YORK,OTHER,STATE`).join('\n')}`;

      fs.writeFileSync(allStatePath, csvContent);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      
      // Should fail because can't select more than 5 state charities
      await expect(selectCharities(allStatePath, profilePath))
        .rejects
        .toThrow('Insufficient total charities');
    });

    it('should handle very large dataset efficiently', async () => {
      const largePath = path.join(testDataDir, 'temp-large-dataset.csv');
      
      // Create a large dataset with 1000 charities
      const headers = 'id,name,state,category,featured\n';
      const rows = Array.from({ length: 1000 }, (_, i) => {
        const states = ['NEW_YORK', 'CALIFORNIA', 'TEXAS', 'FLORIDA'];
        const categories = ['ANIMAL_RELATED', 'HEALTH_CARE', 'EDUCATION', 'OTHER'];
        const featured = ['NATIONAL', 'STATE'];
        
        return [
          i + 1,
          `Charity ${i + 1}`,
          states[i % states.length],
          categories[i % categories.length],
          featured[i % featured.length]
        ].join(',');
      }).join('\n');
      
      fs.writeFileSync(largePath, headers + rows);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      
      const startTime = Date.now();
      const selectedCharities = await selectCharities(largePath, profilePath);
      const endTime = Date.now();
      
      expect(selectedCharities).toHaveLength(12);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed CSV gracefully', async () => {
      const malformedPath = path.join(testDataDir, 'temp-malformed.csv');
      const csvContent = `id,name,state,category,featured
1,"Charity with, comma",NEW_YORK,OTHER,NATIONAL
2,Charity with "quotes",NEW_YORK,OTHER,NATIONAL
3,Charity
with newline,NEW_YORK,OTHER,NATIONAL
4,Normal Charity,NEW_YORK,OTHER,NATIONAL
5,Another Normal,NEW_YORK,OTHER,NATIONAL
6,Yet Another,NEW_YORK,OTHER,NATIONAL
7,More Charity,NEW_YORK,OTHER,NATIONAL
8,Even More,NEW_YORK,OTHER,NATIONAL
9,Still More,NEW_YORK,OTHER,NATIONAL
10,Last One,NEW_YORK,OTHER,NATIONAL
11,Final Charity,NEW_YORK,OTHER,NATIONAL
12,Absolutely Final,NEW_YORK,OTHER,NATIONAL
13,One More,NEW_YORK,OTHER,NATIONAL`;

      fs.writeFileSync(malformedPath, csvContent);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      
      // Should handle malformed data gracefully
      const selectedCharities = await selectCharities(malformedPath, profilePath);
      expect(selectedCharities).toHaveLength(12);
    });

    it('should throw descriptive error for nonexistent charity file', async () => {
      const nonexistentPath = path.join(testDataDir, 'does-not-exist.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      await expect(selectCharities(nonexistentPath, profilePath))
        .rejects
        .toThrow(/CSV file not found.*does-not-exist\.csv/);
    });

    it('should throw descriptive error for nonexistent profile file', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const nonexistentProfilePath = path.join(testDataDir, 'missing-profile.csv');

      await expect(selectCharities(charitiesPath, nonexistentProfilePath))
        .rejects
        .toThrow(/CSV file not found.*missing-profile\.csv/);
    });

    it('should handle empty charity file', async () => {
      const emptyPath = path.join(testDataDir, 'empty.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      await expect(selectCharities(emptyPath, profilePath))
        .rejects
        .toThrow('CSV file is empty');
    });

    it('should handle corrupted profile data', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      
      // Create a profile with missing required fields
      const corruptedProfilePath = path.join(testDataDir, 'temp-corrupted-profile.csv');
      const csvContent = `id,name
999,Incomplete User`;

      fs.writeFileSync(corruptedProfilePath, csvContent);

      try {
        await expect(selectCharities(charitiesPath, corruptedProfilePath))
          .rejects
          .toThrow();
      } finally {
        if (fs.existsSync(corruptedProfilePath)) {
          fs.unlinkSync(corruptedProfilePath);
        }
      }
    });
  });

  describe('Constraint Validation', () => {
    it('should never exceed maximum state charity limit regardless of data', async () => {
      const manyStatePath = path.join(testDataDir, 'temp-many-state.csv');
      
      // Create dataset with many state charities and few national
      const csvContent = `id,name,state,category,featured
${Array.from({ length: 50 }, (_, i) => `${i + 1},NY State Charity ${i + 1},NEW_YORK,ANIMAL_RELATED,STATE`).join('\n')}
${Array.from({ length: 10 }, (_, i) => `${i + 51},National Charity ${i + 1},TEXAS,OTHER,NATIONAL`).join('\n')}`;

      fs.writeFileSync(manyStatePath, csvContent);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      
      // Run multiple times to ensure limit is always respected
      for (let i = 0; i < 10; i++) {
        const selectedCharities = await selectCharities(manyStatePath, profilePath);
        const stateCount = selectedCharities.filter(c => c.featured === 'STATE').length;
        
        expect(stateCount).toBeLessThanOrEqual(5);
        expect(selectedCharities).toHaveLength(12);
      }
    });

    it('should maintain charity uniqueness under all conditions', async () => {
      const charitiesPath = path.join(testDataDir, 'test-charities.csv');
      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');

      // Run many times to test uniqueness
      for (let i = 0; i < 50; i++) {
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        
        const charityIds = selectedCharities.map(c => c.id);
        const uniqueIds = new Set(charityIds);
        
        expect(uniqueIds.size).toBe(charityIds.length); // No duplicates
        expect(charityIds.length).toBe(12);
      }
    });

    it('should handle minimum animal charity requirement edge cases', async () => {
      // Create dataset with exactly 4 animal charities
      const exactAnimalPath = path.join(testDataDir, 'temp-exact-animals.csv');
      const csvContent = `id,name,state,category,featured
1,Animal National 1,TEXAS,ANIMAL_RELATED,NATIONAL
2,Animal National 2,TEXAS,ANIMAL_RELATED,NATIONAL
3,Animal State 1,NEW_YORK,ANIMAL_RELATED,STATE
4,Animal State 2,NEW_YORK,ANIMAL_RELATED,STATE
${Array.from({ length: 15 }, (_, i) => `${i + 5},Other Charity ${i + 1},NEW_YORK,OTHER,NATIONAL`).join('\n')}`;

      fs.writeFileSync(exactAnimalPath, csvContent);

      const profilePath = path.join(testDataDir, 'test-profile-with-pets.csv');
      
      const selectedCharities = await selectCharities(exactAnimalPath, profilePath);
      const animalCharities = selectedCharities.filter(c => c.category === 'ANIMAL_RELATED');
      
      expect(animalCharities.length).toBe(4); // Should select all 4 available
      expect(selectedCharities).toHaveLength(12);
    });
  });
});