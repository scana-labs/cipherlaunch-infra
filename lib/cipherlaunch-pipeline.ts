import * as cdk from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import { CipherLaunchStage } from './cipherlaunch-stage';


const StageToAccountMap: Map<string, string> = new Map<string,string>();
StageToAccountMap.set('dev', '342243318645');

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

    for (let stage of StageToAccountMap.keys()) {
      const cipherLaunchStage  =  new CipherLaunchStage (this, `CipherLaunch-${stage}`, {
        env: {
          account: StageToAccountMap.get(stage), 
          region: 'us-west-2' 
        }
      });
      pipeline.addStage(cipherLaunchStage);
    }
  }
}
