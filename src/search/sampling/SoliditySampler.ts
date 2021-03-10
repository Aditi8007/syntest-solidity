import {
  ConstructorCall,
  ObjectFunctionCall,
  Sampler,
  Statement,
} from "syntest-framework";

/**
 * SolidityRandomSampler class
 *
 * @author Dimitri Stallenberg
 */
export abstract class SoliditySampler extends Sampler {
  abstract sampleConstructor(depth: number): ConstructorCall;
  abstract sampleObjectFunctionCall(
    depth: number,
    type: string
  ): ObjectFunctionCall;
  abstract sampleArgument(depth: number, type: string, bits: number): Statement;
}
