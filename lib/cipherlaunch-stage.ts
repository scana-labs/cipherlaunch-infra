import { Vpc } from '@aws-cdk/aws-ec2';
import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { CipherLaunchContainerService } from './infraStacks/cipherlaunch-containerService';
import { CipherLaunchVPC } from './infraStacks/cipherlaunch-vpc';

export interface CipherLaunchStageProps extends StageProps {
  stage: string;
}

export class CipherLaunchStage extends Stage {
  constructor(scope: Construct, id: string, props: CipherLaunchStageProps) {
      super(scope, id, props);
  
      const cipherLaunchVPC = new CipherLaunchVPC(this, 'VPC', props);

      const cipherLaunchContainerService = new CipherLaunchContainerService(this, 'api', {
        vpc: cipherLaunchVPC.vpc,
        ... props
      });

      cipherLaunchContainerService.addDependency(cipherLaunchVPC);
    }
}