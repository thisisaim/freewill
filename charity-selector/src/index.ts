import { selectCharities } from './charitySelector';

function validateCommandLineArgs(): { charitiesPath: string; profilePath: string } {
    const charitiesPath = process.argv[2];
    const profilePath = process.argv[3];

    if (!charitiesPath || !profilePath) {
        console.error('Usage: node index.js <charities_csv_path> <profile_csv_path>');
        console.error('Example: node index.js charities.csv example-profile.csv');
        process.exit(1);
    }

    return { charitiesPath, profilePath };
}

function formatCharityOutput(charity: any): string {
    try {
        const output = {
            id: charity.id,
            name: charity.name,
            state: charity.state,
            category: charity.category,
            featured: charity.featured
        };
        return JSON.stringify(output);
    } catch (error) {
        console.error('Error formatting charity output:', error);
        return JSON.stringify({ error: 'Failed to format charity data' });
    }
}

async function main(): Promise<void> {
    try {
        console.log('FreeWill Charity Selector');
        console.log('========================');
        
        const { charitiesPath, profilePath } = validateCommandLineArgs();
        
        console.log(`Charities file: ${charitiesPath}`);
        console.log(`Profile file: ${profilePath}`);
        console.log('');
        
        const selectedCharities = await selectCharities(charitiesPath, profilePath);
        
        console.log('Selected Charities:');
        console.log('==================');
        
        selectedCharities.forEach((charity, index) => {
            try {
                console.log(formatCharityOutput(charity));
            } catch (error) {
                console.error(`Error outputting charity ${index + 1}:`, error);
            }
        });
        
        console.log('');
        console.log(`Total charities selected: ${selectedCharities.length}`);
        
    } catch (error) {
        console.error('');
        console.error('CHARITY SELECTION FAILED');
        console.error('========================');
        if (error instanceof Error) {
            console.error('Error:', error.message);
            if (process.env.NODE_ENV === 'development') {
                console.error('Stack trace:', error.stack);
            }
        } else {
            console.error('Unknown error occurred:', error);
        }
        process.exit(1);
    }
}

main();
