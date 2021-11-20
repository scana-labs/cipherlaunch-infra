import * as cdk from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';

const applicationAccount = '342243318645'

const stageToRegionMap: Map<string, string> = new Map<string,string>();
stageToRegionMap.set('dev', 'us-west-2');
stageToRegionMap.set('prod', 'us-east-1');

export class CipherLaunchPipeline extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'CipherLaunch-Backend',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('scana-labs/cipherlaunch-infra', 'main'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    for (let stage of stageToRegionMap.keys()) {
      // Add Stacks
    }
  }
}
