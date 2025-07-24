# Takehome problem

Thank you for interviewing with FreeWill! This problem is designed to evaluate your coding style on a practical problem. The efficiency of your program is secondary. We anticipate this exercise will take approximately one hour, but you are welcome to use more time.

FreeWill allows nonprofits to pay for a chance to be featured on our site. We randomly choose 12 charities to feature from among those who have paid us for special featured placement.

Write a command line program to pick the 12 featured charities. Some charities are featured nationally, and should be in the pool to be selected for anyone. Some charities pay to be featured in a single state (`state`), and should only be picked if they match the user's state. Many are not featured.

Our primary language here at FreeWill is Typescript, so we ask that you complete this exercise using either JavaScript or TypeScript.

You may use third party dependencies (such as to implement a [shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)), but be sure to include a dependencies file such as `package.json`. Feel free to consult resources or the internet.

Boilerplate code is provided for Javascript. If you choose to do this in TypeScript, create your own project and be sure to include a README.md with compilation instructions.

It's okay if you need to bring data into memory, this is likely necessary since this problem provides a flat data file, not a query-able database.

## Part 1:

Your program should take in these command line arguments: charities profileInfo
 - charities: Path to a CSV of charities
 - profileInfo: Path to a CSV of the user's profile information (1 header row and 1 data row)

Your program should output 12 random distinct charity objects (which should include the `id`, `name`, `state`, `category`, and `featured` properties for each charity), one per line, in a random order.

Your solution should fulfill the following constraints:

- The number of state-featured charities that are selected must be random, not a fixed number. 
- State-featured charities chosen must match the user's state of residence. 
- The number of state-featured charities chosen must not exceed 5. 
- The rest of the charities your program chooses must be nationally-featured charities.


## Part 2

We want the charities we pick to be more tailored to the user. If the user in profileInfo has pets, ensure that at least 4 are ANIMAL_RELATED organizations. Ensure that this doesn't change the probability of picking state and national features (e.g. that both state and national animal orgs may be picked).

When designing your code, consider that we may want to have more such tailoring in the future.

The number of ANIMAL_RELATED charities that are selected should be random, not a fixed number. Your solution to part 2 should still fulfill the constraints outlined in part 1: the number of state-featured charities that are selected must be random, state-featured charities chosen must match the user's state of residence, the number of state-featured charities chosen must not exceed 5, and the remainder of the chosen charities must be nationally featured.

Keep in mind that your solution should still work as expected in part 1 if the user does not have pets.

## Submit

Submit a ZIP file containing your program file(s) and dependency file. Ensure that your source code file is included, as we will be reviewing your code. Please refrain from including your name in your submitted files to help our graders conduct a bias-free screening process.

(The data used and problem statement were generated for the sake of this problem and do not reflect actual FreeWill functionality or customers)

## Boilerplate Compilation Instructions

1. Run 'npm i' to install dependencies
2. Compile & Run: "node index.js data/charities.csv data/example-profile.csv"

## Grading

If you use the provided boilerplate, we are going to run the above commands from the `boilerplate-js` directory to grade your output. Please test these steps before submitting to ensure the output is as expected.

If you build your own solution from scratch, please remember to provide a README.md with compilation instructions on how to run your code. Unfortunately, if we are unable to get your solution to run with the provided instructions your submission will not be considered.

Grading will consider the correctness of the output, as well as code quality and solution design.

Please note that the charities and profileInfo CSV files your submission will be tested against may be different from the ones that are provided and may contain different numbers of charities in each state, category, and featureship level.