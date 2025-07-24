# FreeWill Charity Selector

A TypeScript command-line application that randomly selects 12 featured charities based on user preferences and geographic location.

## Features

- **Random Selection**: Uses Fisher-Yates shuffle algorithm for fair randomization
- **Geographic Targeting**: Selects mix of national and state-specific charities
- **User Preferences**: Tailors selection based on user profile (e.g., pet owners get animal-related charities)
- **Flexible Constraints**: Randomly determines state charity count (0-5) while maintaining total of 12
- **Production Ready**: Comprehensive error handling, input validation, and logging
- **Extensible**: Designed to easily add new user preference rules

## Requirements

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone or extract the project files
2. Navigate to the project directory:
   ```bash
   cd charity-selector
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Compilation Instructions

### Build the TypeScript project:
```bash
npm run build
```

This compiles TypeScript files from `src/` directory into JavaScript files in the `dist/` directory.

## Usage

### Basic Usage
```bash
node dist/index.js <charities_csv_path> <profile_csv_path>
```

### Example
```bash
node dist/index.js charities.csv example-profile.csv
```

### Using npm scripts
```bash
# Build and run with example data
npm run dev

# Run with custom data (after building)
npm run start
```

## Input File Formats

### Charities CSV
Required columns:
- `id`: Unique identifier
- `name`: Charity name
- `state`: State abbreviation (e.g., "NEW_YORK", "CALIFORNIA")
- `category`: Charity category (e.g., "ANIMAL_RELATED", "HEALTH_CARE")
- `featured`: "NATIONAL", "STATE", or empty string

Example:
```csv
id,name,state,category,featured
1,Animal Rescue League,NEW_YORK,ANIMAL_RELATED,STATE
2,Red Cross,CALIFORNIA,HEALTH_CARE,NATIONAL
```

### Profile CSV
Required columns:
- `id`: User ID
- `name`: User name
- `state`: User's state (must match charity state format)
- `isMarried`: "TRUE" or "FALSE"
- `hasChildren`: "TRUE" or "FALSE"
- `hasPets`: "TRUE" or "FALSE"
- `age`: Numeric age

Example:
```csv
id,name,state,isMarried,hasChildren,hasPets,age
789,John Doe,NEW_YORK,TRUE,FALSE,TRUE,65
```

## Selection Logic

### Part 1: Basic Selection
1. **Total Output**: Always selects exactly 12 charities
2. **State Limit**: Maximum 5 state-specific charities per selection
3. **Random Distribution**: Randomly determines 0-5 state charities, fills remainder with national
4. **Geographic Matching**: State charities must match user's state
5. **Random Order**: Final output is shuffled

### Part 2: User Preferences
- **Pet Owners**: Guaranteed minimum 4 animal-related charities
- **Smart Distribution**: Animal charities selected from both national and state pools
- **Extensible**: Easy to add new preference rules (marriage, children, age, etc.)

## Output Format

Each selected charity is output as a JSON object with:
```json
{
  "id": "123",
  "name": "Charity Name",
  "state": "STATE_NAME", 
  "category": "CATEGORY_NAME",
  "featured": "NATIONAL"
}
```

## Development

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled application with example data
- `npm run dev` - Build and run in one command
- `npm run watch` - Watch for changes and auto-recompile
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:verbose` - Run tests with verbose output

### Project Structure
```
src/
├── index.ts              # Main entry point
├── charitySelector.ts    # Core selection logic
├── types.ts             # TypeScript interfaces
└── utils/
    └── csvReader.ts     # CSV parsing utilities
```

### Error Handling
The application includes comprehensive error handling for:
- Missing or invalid input files
- Malformed CSV data
- Insufficient charity data
- Invalid user profiles
- File system errors

## Testing

The application includes a comprehensive test suite using Jest and TypeScript.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with detailed output
npm run test:verbose
```

### Test Structure

The test suite is organized into four main categories:

#### 1. Unit Tests (`tests/csvReader.test.ts`)
- CSV file reading and parsing
- User profile data validation and conversion
- Charity data validation
- Error handling for malformed data

#### 2. Core Logic Tests (`tests/charitySelector.test.ts`)
- Charity selection algorithm correctness
- Constraint validation (exactly 12 charities, ≤5 state, ≥4 animal for pet owners)
- Random selection verification
- State matching validation
- Randomness testing across multiple runs

#### 3. Integration Tests (`tests/integration.test.ts`)
- End-to-end workflow validation
- Full requirement compliance testing
- Different user profile scenarios
- Boundary condition testing
- Performance testing with large datasets

#### 4. Edge Case Tests (`tests/edgeCases.test.ts`)
- Insufficient data scenarios
- Malformed CSV handling
- File system errors
- Data availability edge cases
- Constraint validation under extreme conditions

### Test Coverage

The test suite covers:
- **Part 1 Requirements**: Random selection, state limits, geographic matching
- **Part 2 Requirements**: Pet owner preferences, extensible tailoring system
- **Error Handling**: File errors, data validation, constraint violations
- **Edge Cases**: Insufficient data, malformed input, boundary conditions
- **Performance**: Large dataset handling, execution time validation
- **Randomness**: Statistical validation of random behavior

### Test Data

Test files are located in `tests/data/`:
- `test-charities.csv` - 30 diverse charities for comprehensive testing
- `test-profile-with-pets.csv` - Pet owner profile
- `test-profile-no-pets.csv` - Non-pet owner profile
- `invalid-charities.csv` - Malformed data for error testing
- `empty.csv` - Empty file for edge case testing

### Manual Testing Examples

#### Test with pet owner (expects ≥4 animal charities):
```bash
node dist/index.js charities.csv example-profile.csv | grep ANIMAL_RELATED | wc -l
```

#### Test randomness (run multiple times):
```bash
for i in {1..3}; do
  echo "Run $i:"
  node dist/index.js charities.csv example-profile.csv | grep "Final distribution"
  echo
done
```

#### Validate output count:
```bash
node dist/index.js charities.csv example-profile.csv | grep "Total charities selected"
```

#### Test error handling:
```bash
# Test with missing file
node dist/index.js nonexistent.csv example-profile.csv

# Test with insufficient arguments
node dist/index.js
```

## License

ISC

## Notes

- The application is designed to handle various edge cases and provides detailed logging
- Random selections ensure fair distribution while respecting all constraints
- The extensible design allows for easy addition of new user preference rules
- All selections maintain the required balance between national and state charities