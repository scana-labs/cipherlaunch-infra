import { Vpc } from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { CipherLaunchContainerService } from './infraStacks/cipherlaunch-containerService';
import { CipherLaunchVPC } from './infraStacks/cipherlaunch-vpc';

export class CipherLaunchStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
      super(scope, id, props);
  
      const cipherLaunchVPC = new CipherLaunchVPC(this, `${id}-VPC`, props);

      const cipherLaunchContainerService = new CipherLaunchContainerService(this, '${id}-container', {
        vpc: cipherLaunchVPC.vpc,
        ... props
      });
    }
}