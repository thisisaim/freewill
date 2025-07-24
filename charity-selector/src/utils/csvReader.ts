import csv from 'csv-parser';
import * as fs from 'fs';
import { RawUserProfile, UserProfile, Charity } from '../types';

export function readCsvFile<T>(path: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const results: T[] = [];
        
        try {
            if (!fs.existsSync(path)) {
                reject(new Error(`CSV file not found: ${path}`));
                return;
            }

            const stats = fs.statSync(path);
            if (!stats.isFile()) {
                reject(new Error(`Path is not a file: ${path}`));
                return;
            }

            if (stats.size === 0) {
                reject(new Error(`CSV file is empty: ${path}`));
                return;
            }

            fs.createReadStream(path)
                .pipe(csv())
                .on('data', (data: T) => {
                    try {
                        if (data && typeof data === 'object') {
                            results.push(data);
                        } else {
                            console.error(`Invalid data row in ${path}:`, data);
                        }
                    } catch (error) {
                        console.error(`Error processing row in ${path}:`, error);
                    }
                })
                .on('end', () => {
                    try {
                        if (results.length === 0) {
                            reject(new Error(`No valid data found in CSV file: ${path}`));
                            return;
                        }
                        console.log(`Successfully loaded ${results.length} records from ${path}`);
                        resolve(results);
                    } catch (error) {
                        console.error(`Error processing CSV results from ${path}:`, error);
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    console.error(`Error reading CSV file ${path}:`, error);
                    reject(new Error(`Failed to read CSV file: ${path}. ${error.message}`));
                });
        } catch (error) {
            console.error(`Error accessing CSV file ${path}:`, error);
            reject(new Error(`Failed to access CSV file: ${path}. ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

export function parseUserProfile(rawProfile: RawUserProfile): UserProfile {
    try {
        if (!rawProfile || !rawProfile.id || !rawProfile.name || !rawProfile.state) {
            throw new Error('Profile missing required fields (id, name, state)');
        }

        return {
            id: rawProfile.id,
            name: rawProfile.name,
            state: rawProfile.state,
            isMarried: rawProfile.isMarried?.toUpperCase() === 'TRUE',
            hasChildren: rawProfile.hasChildren?.toUpperCase() === 'TRUE',
            hasPets: rawProfile.hasPets?.toUpperCase() === 'TRUE',
            age: parseInt(rawProfile.age, 10) || 0
        };
    } catch (error) {
        console.error('Error parsing user profile:', error);
        throw new Error(`Failed to parse user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function validateCharity(charity: Charity): boolean {
    try {
        if (!charity.id || !charity.name) {
            console.error('Charity missing required fields (id, name):', charity);
            return false;
        }

        if (charity.featured && !['NATIONAL', 'STATE', ''].includes(charity.featured)) {
            console.error('Charity has invalid featured value:', charity);
            return false;
        }

        if (charity.featured === 'STATE' && !charity.state) {
            console.error('State charity missing state field:', charity);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating charity:', error);
        return false;
    }
}
