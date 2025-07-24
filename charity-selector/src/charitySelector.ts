import { Charity, UserProfile, RawUserProfile, SelectionConstraints, TailoringRule } from './types';
import { readCsvFile, parseUserProfile, validateCharity } from './utils/csvReader';
import { shuffle } from 'lodash';

const DEFAULT_CONSTRAINTS: SelectionConstraints = {
    totalCharities: 12,
    maxStateCharities: 5,
    minAnimalCharitiesIfPets: 4
};

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectRandomItems<T>(items: T[], count: number): T[] {
    try {
        if (count <= 0) return [];
        if (count >= items.length) return shuffle([...items]);
        
        const shuffled = shuffle([...items]);
        return shuffled.slice(0, count);
    } catch (error) {
        console.error('Error selecting random items:', error);
        return [];
    }
}

function createTailoringRules(): TailoringRule[] {
    return [
        {
            applies: (profile: UserProfile) => profile.hasPets,
            getMinCount: () => DEFAULT_CONSTRAINTS.minAnimalCharitiesIfPets,
            getCategory: () => 'ANIMAL_RELATED'
        }
    ];
}

function applyTailoringRules(
    profile: UserProfile,
    nationalCharities: Charity[],
    stateCharities: Charity[],
    selectedNationalCount: number,
    selectedStateCount: number
): { national: Charity[], state: Charity[], remainingNational: number, remainingState: number } {
    try {
        const rules = createTailoringRules();
        let selectedNational: Charity[] = [];
        let selectedState: Charity[] = [];
        let remainingNational = selectedNationalCount;
        let remainingState = selectedStateCount;

        for (const rule of rules) {
            if (!rule.applies(profile)) continue;

            try {
                const category = rule.getCategory();
                const minCount = rule.getMinCount(profile);
                
                const availableNational = nationalCharities.filter(c => 
                    c.category === category && !selectedNational.some(s => s.id === c.id)
                );
                const availableState = stateCharities.filter(c => 
                    c.category === category && !selectedState.some(s => s.id === c.id)
                );
                
                const totalAvailable = availableNational.length + availableState.length;
                if (totalAvailable < minCount) {
                    console.warn(`Warning: Only ${totalAvailable} ${category} charities available, need ${minCount}`);
                }
                
                const actualMinCount = Math.min(minCount, totalAvailable, remainingNational + remainingState);
                if (actualMinCount <= 0) continue;
                
                // Randomly distribute between national and state while respecting limits
                const maxFromState = Math.min(remainingState, availableState.length);
                const maxFromNational = Math.min(remainingNational, availableNational.length);
                
                let fromState = 0;
                let fromNational = 0;
                
                // Randomly determine distribution
                for (let i = 0; i < actualMinCount; i++) {
                    const canPickState = fromState < maxFromState;
                    const canPickNational = fromNational < maxFromNational;
                    
                    if (canPickState && canPickNational) {
                        // Random choice
                        if (Math.random() < 0.5) {
                            fromState++;
                        } else {
                            fromNational++;
                        }
                    } else if (canPickState) {
                        fromState++;
                    } else if (canPickNational) {
                        fromNational++;
                    }
                }
                
                const newStateCharities = selectRandomItems(availableState, fromState);
                const newNationalCharities = selectRandomItems(availableNational, fromNational);
                
                selectedState.push(...newStateCharities);
                selectedNational.push(...newNationalCharities);
                remainingState -= fromState;
                remainingNational -= fromNational;
                
                console.log(`Applied ${rule.getCategory()} rule: selected ${fromNational} national + ${fromState} state charities`);
            } catch (error) {
                console.error(`Error applying tailoring rule for ${rule.getCategory()}:`, error);
            }
        }

        return { national: selectedNational, state: selectedState, remainingNational, remainingState };
    } catch (error) {
        console.error('Error applying tailoring rules:', error);
        return { national: [], state: [], remainingNational: selectedNationalCount, remainingState: selectedStateCount };
    }
}

export async function selectCharities(charitiesPath: string, profilePath: string): Promise<Charity[]> {
    try {
        console.log('Starting charity selection process...');
        
        // Load and validate data
        const rawCharities = await readCsvFile<Charity>(charitiesPath);
        const rawProfiles = await readCsvFile<RawUserProfile>(profilePath);
        
        if (rawProfiles.length === 0) {
            throw new Error('No user profile found in profile CSV');
        }
        
        const userProfile = parseUserProfile(rawProfiles[0]);
        console.log(`User profile loaded: ${userProfile.name} from ${userProfile.state}, hasPets: ${userProfile.hasPets}`);
        
        // Validate and filter charities
        const validCharities = rawCharities.filter(validateCharity);
        console.log(`${validCharities.length} valid charities out of ${rawCharities.length} total`);
        
        if (validCharities.length < DEFAULT_CONSTRAINTS.totalCharities) {
            throw new Error(`Insufficient charities: need ${DEFAULT_CONSTRAINTS.totalCharities}, have ${validCharities.length}`);
        }
        
        // Separate charities by featured type
        const nationalCharities = validCharities.filter(c => c.featured === 'NATIONAL');
        const stateCharities = validCharities.filter(c => 
            c.featured === 'STATE' && c.state === userProfile.state
        );
        
        console.log(`Available: ${nationalCharities.length} national, ${stateCharities.length} state charities`);
        
        // Randomly determine how many state charities to include (0-5)
        const maxPossibleState = Math.min(DEFAULT_CONSTRAINTS.maxStateCharities, stateCharities.length);
        let selectedStateCount = getRandomInt(0, maxPossibleState);
        let selectedNationalCount = DEFAULT_CONSTRAINTS.totalCharities - selectedStateCount;
        
        // Check if we can meet animal requirements with current distribution
        if (userProfile.hasPets) {
            const availableAnimalNational = nationalCharities.filter(c => c.category === 'ANIMAL_RELATED').length;
            const availableAnimalState = stateCharities.filter(c => c.category === 'ANIMAL_RELATED').length;
            const totalAvailableAnimals = availableAnimalNational + availableAnimalState;
            
            if (totalAvailableAnimals >= DEFAULT_CONSTRAINTS.minAnimalCharitiesIfPets) {
                // Ensure we can get at least 4 animals by adjusting distribution if needed
                const maxAnimalFromState = Math.min(availableAnimalState, selectedStateCount);
                const maxAnimalFromNational = Math.min(availableAnimalNational, selectedNationalCount);
                
                if (maxAnimalFromState + maxAnimalFromNational < DEFAULT_CONSTRAINTS.minAnimalCharitiesIfPets) {
                    // Need to adjust distribution to meet animal requirement
                    const neededMoreAnimals = DEFAULT_CONSTRAINTS.minAnimalCharitiesIfPets - (maxAnimalFromState + maxAnimalFromNational);
                    
                    if (availableAnimalNational > maxAnimalFromNational && selectedNationalCount < nationalCharities.length) {
                        // Try to increase national count
                        const canIncrease = Math.min(neededMoreAnimals, availableAnimalNational - maxAnimalFromNational, nationalCharities.length - selectedNationalCount);
                        selectedNationalCount += canIncrease;
                        selectedStateCount -= canIncrease;
                    } else if (availableAnimalState > maxAnimalFromState && selectedStateCount < Math.min(DEFAULT_CONSTRAINTS.maxStateCharities, stateCharities.length)) {
                        // Try to increase state count
                        const canIncrease = Math.min(neededMoreAnimals, availableAnimalState - maxAnimalFromState, Math.min(DEFAULT_CONSTRAINTS.maxStateCharities, stateCharities.length) - selectedStateCount);
                        selectedStateCount += canIncrease;
                        selectedNationalCount -= canIncrease;
                    }
                }
            }
        }
        
        console.log(`Target selection: ${selectedNationalCount} national + ${selectedStateCount} state = ${DEFAULT_CONSTRAINTS.totalCharities} total`);
        
        // Adjust targets if insufficient charities available
        if (selectedNationalCount > nationalCharities.length) {
            const shortage = selectedNationalCount - nationalCharities.length;
            console.warn(`Insufficient national charities: need ${selectedNationalCount}, have ${nationalCharities.length}. Adjusting targets.`);
            
            // Try to compensate with more state charities if possible
            const maxPossibleStateAdjusted = Math.min(DEFAULT_CONSTRAINTS.maxStateCharities, stateCharities.length);
            const canAddToState = Math.min(shortage, maxPossibleStateAdjusted - selectedStateCount);
            
            selectedStateCount += canAddToState;
            selectedNationalCount -= canAddToState;
            
            // If still insufficient, we need to reduce total selection
            if (selectedNationalCount > nationalCharities.length) {
                selectedNationalCount = nationalCharities.length;
                
                // Final check - if we can't meet the total requirement, throw error
                const totalAvailable = nationalCharities.length + selectedStateCount;
                if (totalAvailable < DEFAULT_CONSTRAINTS.totalCharities) {
                    throw new Error(`Insufficient total charities: need ${DEFAULT_CONSTRAINTS.totalCharities}, have ${totalAvailable} (${nationalCharities.length} national + ${selectedStateCount} state)`);
                }
            }
        }
        
        // Apply tailoring rules (e.g., pet preferences)
        const tailoringResult = applyTailoringRules(
            userProfile,
            nationalCharities,
            stateCharities,
            selectedNationalCount,
            selectedStateCount
        );
        
        // Fill remaining slots with random charities
        const remainingNationalCharities = nationalCharities.filter(c => 
            !tailoringResult.national.some(selected => selected.id === c.id)
        );
        const remainingStateCharities = stateCharities.filter(c => 
            !tailoringResult.state.some(selected => selected.id === c.id)
        );
        
        const additionalNational = selectRandomItems(remainingNationalCharities, tailoringResult.remainingNational);
        const additionalState = selectRandomItems(remainingStateCharities, tailoringResult.remainingState);
        
        // Combine all selected charities
        const finalSelection = [
            ...tailoringResult.national,
            ...tailoringResult.state,
            ...additionalNational,
            ...additionalState
        ];
        
        // Final validation - allow for reduced selection if insufficient data
        const expectedCount = Math.min(DEFAULT_CONSTRAINTS.totalCharities, nationalCharities.length + stateCharities.length);
        if (finalSelection.length !== expectedCount) {
            throw new Error(`Selection count mismatch: expected ${expectedCount}, got ${finalSelection.length}`);
        }
        
        // Shuffle final results for random order
        const shuffledResults = shuffle(finalSelection);
        
        console.log(`Successfully selected ${shuffledResults.length} charities`);
        console.log(`Final distribution: ${shuffledResults.filter(c => c.featured === 'NATIONAL').length} national, ${shuffledResults.filter(c => c.featured === 'STATE').length} state`);
        
        return shuffledResults;
        
    } catch (error) {
        console.error('Error in selectCharities:', error);
        throw new Error(`Charity selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
