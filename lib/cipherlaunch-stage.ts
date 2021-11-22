import { Vpc } from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { CipherLaunchContainerService } from './infraStacks/cipherlaunch-containerService';
import { CipherLaunchVPC } from './infraStacks/cipherlaunch-vpc';

export class CipherLaunchStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
      super(scope, id, props);
  
      const cipherLaunchVPC = new CipherLaunchVPC(this, 'VPC', props);

      const cipherLaunchContainerService = new CipherLaunchContainerService(this, 'api', {
        vpc: cipherLaunchVPC.vpc,
        ... props
      });

      cipherLaunchContainerService.addDependency(cipherLaunchVPC);
    }
}