export declare function setupTempFolders(tempContractsDir: string, tempArtifactsDir: string): Promise<void>;
export declare function tearDownTempFolders(tempContractsDir: string, tempArtifactsDir: string): Promise<void>;
/**
 * Save a set of instrumented files to a temporary directory.
 * @param  {Object[]} targets   array of targets generated by `assembleTargets`
 * @param  {[type]} originalDir absolute path to original contracts directory
 * @param  {[type]} tempDir     absolute path to temp contracts directory
 */
export declare function save(targets: any, originalDir: any, tempDir: any): void;
/**
 * Returns a list of test files to pass to mocha.
 * @param  {Object}   config  truffleConfig
 * @return {String[]}         list of files to pass to mocha
 */
export declare function getTestFilePaths(config: any): Promise<any>;
//# sourceMappingURL=fileSystem.d.ts.map