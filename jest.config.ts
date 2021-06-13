/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        "<rootDir>/src/**/*.ts",
        "!<rootDir>/src/molstar-utils.ts",
        "!<rootDir>/src/examples"
    ],

    // The directory where Jest should output its coverage files
    coverageDirectory: "<rootDir>/coverage",

    // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
    moduleNameMapper: {
        "^Molstar/(.*)": "<rootDir>/node_modules/molstar/lib/$1"
    },
    // A preset that is used as a base for Jest's configuration
    preset: "ts-jest",
    transform: {
        "^.+\\.(ts|js|html)$": "babel-jest"
    },
    //An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation

    transformIgnorePatterns: ["node_modules/?!(molstar/lib/mol-model/structure.js)"]
};
