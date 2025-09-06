export declare function detectPackageManager(): "npm" | "yarn" | "pnpm";
export declare function runCommand(command: string, options?: {
    cwd?: string;
    silent?: boolean;
}): boolean;
export declare function setupSupabase(projectPath: string): Promise<boolean>;
export declare function setupShadcn(projectPath: string, addAllComponents?: boolean): Promise<boolean>;
export declare function createEnvFile(projectPath: string, isExpoApp?: boolean): void;
export declare function createSupabaseClient(projectPath: string, isExpoApp?: boolean): void;
export declare function createNextjsMiddleware(projectPath: string): void;
export declare function createCoolifyConfig(projectPath: string, appName: string): void;
export declare function createPnpmWorkspace(projectPath: string): void;
export declare function createSharedPackage(projectPath: string): void;
export declare function createSupabaseMigration(projectPath: string): boolean;
export declare function updateSupabaseConfig(projectPath: string): boolean;
export declare function setupSupabaseTypes(projectPath: string, isExpoApp?: boolean): void;
export declare function updatePackageJsonScripts(projectPath: string, isExpoApp?: boolean, isMonorepoRoot?: boolean): void;
export declare function createProjectReadme(projectPath: string, projectName: string, isMonorepo: boolean, templateType: "bare" | "opinionated"): void;
export declare function createProjectClaudeMd(projectPath: string, projectName: string, isMonorepo: boolean, templateType: "bare" | "opinionated"): void;
export declare function setupExpoRouter(projectPath: string): boolean;
export declare function setupReactNativeReusables(projectPath: string): boolean;
export declare function setupLegendState(projectPath: string, isExpoApp?: boolean): boolean;
export declare function setupPrettierAndESLint(projectPath: string, isExpoApp?: boolean): boolean;
//# sourceMappingURL=utils.d.ts.map