import * as cdk from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import { CipherLaunchStage } from './cipherlaunch-stage';

const ApplicationAccount = '342243318645'

const StageToRegionMap: Map<string, string> = new Map<string,string>();
StageToRegionMap.set('dev', 'us-west-2');
StageToRegionMap.set('prod', 'us-east-1');

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

    for (let stage of StageToRegionMap.keys()) {
      const cipherLaunchStage  =  new CipherLaunchStage (this, `CipherLaunch-${stage}`, {
        env: {
          account: ApplicationAccount, 
          region: StageToRegionMap.get(stage) 
        }
      });
    }
  }
}
