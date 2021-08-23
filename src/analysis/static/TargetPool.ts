import { SourceGenerator } from "./source/SourceGenerator";
import { ASTGenerator } from "./ast/ASTGenerator";
import * as path from "path";
import { TargetMapGenerator } from "./map/TargetMapGenerator";
import { SolidityCFGFactory } from "../../graph/SolidityCFGFactory";
import { ContractMetadata } from "./map/ContractMetadata";
import { ContractFunction } from "./map/ContractFunction";
import { CFG } from "syntest-framework";
import {Target} from "./Target";
import {DependencyAnalyzer} from "./dependency/DependencyAnalyzer";

/**
 * Pool for retrieving and caching expensive processing calls.
 *
 * Can be used to retrieve target sources, ASTs, maps, and CFGs.
 *
 * @author Mitchell Olsthoorn
 */
export class TargetPool {
  protected _sourceGenerator: SourceGenerator;
  protected _abstractSyntaxTreeGenerator: ASTGenerator;
  protected _targetMapGenerator: TargetMapGenerator;
  protected _controlFlowGraphGenerator: SolidityCFGFactory;

  // Mapping: filepath -> target name -> target
  protected _targets: Map<string, Map<string, Target>>

  // Mapping: filepath -> source code
  protected _sources: Map<string, string>;

  // Mapping: filepath -> AST
  protected _abstractSyntaxTrees: Map<string, any>;

  // Mapping: filepath -> target name -> target
  protected _targetMap: Map<string, Map<string, ContractMetadata>>;

  // Mapping: filepath -> target name -> function name -> function
  protected _functionMaps: Map<
    string,
    Map<string, Map<string, ContractFunction>>
  >;

  // Mapping: filepath -> target name -> (function name -> CFG)
  protected _controlFlowGraphs: Map<string, [CFG, string[]]>;

  constructor(
    sourceGenerator: SourceGenerator,
    abtractSyntaxTreeGenerator: ASTGenerator,
    targetMapGenerator: TargetMapGenerator,
    controlFlowGraphGenerator: SolidityCFGFactory
  ) {
    this._sourceGenerator = sourceGenerator;
    this._abstractSyntaxTreeGenerator = abtractSyntaxTreeGenerator;
    this._targetMapGenerator = targetMapGenerator;
    this._controlFlowGraphGenerator = controlFlowGraphGenerator;

    this._sources = new Map<string, string>();
    this._abstractSyntaxTrees = new Map<string, any>();
    this._targetMap = new Map<string, Map<string, ContractMetadata>>();
    this._functionMaps = new Map<
      string,
      Map<string, Map<string, ContractFunction>>
    >();
    this._controlFlowGraphs = new Map<string, [CFG, string[]]>();
  }

  /**
   * Create a target from the target pool.
   *
   * @param targetPath The path to the target file
   * @param targetName the name of the target
   */
  createTarget(
      targetPath: string,
      targetName: string
  ): Target {
    const absoluteTargetPath = path.resolve(targetPath);

    // Get source, AST, FunctionMap, and CFG for target under test
    const source = this.getSource(absoluteTargetPath);
    const abstractSyntaxTree = this.getAST(absoluteTargetPath);
    const functionMap = this.getFunctionMap(absoluteTargetPath, targetName);
    const controlFlowGraph = this.getCFG(absoluteTargetPath, targetName);

    // Analyze dependencies
    const analyzer = new DependencyAnalyzer(this);

    const importGraph = analyzer.analyzeImports(targetPath);
    const context = analyzer.analyzeContext(importGraph);
    const inheritanceGraph = analyzer.analyzeInheritance(context, targetName);

    const dependencies = importGraph.getNodes();

    const linkingGraph = analyzer.analyzeLinking(
        importGraph,
        context,
        targetName
    );

    const target = new Target(
        absoluteTargetPath,
        targetName,
        source,
        abstractSyntaxTree,
        context,
        functionMap,
        controlFlowGraph,
        linkingGraph,
        dependencies
    );

    if (this._targets.has(targetPath)) {
      this._targets.set(targetPath, new Map<string, Target>())
    }

    this._targets.get(targetPath).set(targetName, target)

    return target
  }

  getSource(targetPath: string): string {
    const absoluteTargetPath = path.resolve(targetPath);

    if (this._sources.has(absoluteTargetPath)) {
      return this._sources.get(absoluteTargetPath);
    } else {
      const source = this._sourceGenerator.generate(absoluteTargetPath);
      this._sources.set(absoluteTargetPath, source);
      return source;
    }
  }

  getAST(targetPath: string): string {
    const absoluteTargetPath = path.resolve(targetPath);

    if (this._abstractSyntaxTrees.has(absoluteTargetPath)) {
      return this._abstractSyntaxTrees.get(absoluteTargetPath);
    } else {
      const targetSource = this.getSource(absoluteTargetPath);
      const targetAST =
        this._abstractSyntaxTreeGenerator.generate(targetSource);
      this._abstractSyntaxTrees.set(absoluteTargetPath, targetAST);
      return targetAST;
    }
  }

  getTargetMap(targetPath: string): Map<string, any> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (this._targetMap.has(absoluteTargetPath)) {
      return this._targetMap.get(absoluteTargetPath);
    } else {
      const targetAST = this.getAST(absoluteTargetPath);
      const { targetMap, functionMap } =
        this._targetMapGenerator.generate(targetAST);
      this._targetMap.set(absoluteTargetPath, targetMap);
      this._functionMaps.set(absoluteTargetPath, functionMap);
      return targetMap;
    }
  }

  getFunctionMap(targetPath: string, targetName: string): Map<string, any> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._functionMaps.has(absoluteTargetPath)) {
      const targetAST = this.getAST(absoluteTargetPath);
      const { targetMap, functionMap } =
        this._targetMapGenerator.generate(targetAST);
      this._targetMap.set(absoluteTargetPath, targetMap);
      this._functionMaps.set(absoluteTargetPath, functionMap);
    }

    if (this._functionMaps.get(absoluteTargetPath).has(targetName)) {
      return this._functionMaps.get(absoluteTargetPath).get(targetName);
    } else {
      throw new Error(
        `Target ${targetName} could not be found at ${targetPath}`
      );
    }
  }

  getCFG(targetPath: string, targetName: string): CFG {
    const absoluteTargetPath = path.resolve(targetPath);

    if (this._targets.has(absoluteTargetPath)) {
      if (this._targets.get(absoluteTargetPath).has(targetName)) {
        return this._targets.get(absoluteTargetPath).get(targetName).controlFlowGraph
      }
    }

    const targetAST = this.getAST(absoluteTargetPath);
    const cfg = this._controlFlowGraphGenerator.convertAST(
      targetAST,
      false,
      false
    );
    this._controlFlowGraphs.set(absoluteTargetPath, cfg);
    return cfg;
  }
}
