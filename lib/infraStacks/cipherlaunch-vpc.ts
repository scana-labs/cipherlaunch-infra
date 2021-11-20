import * as cdk from '@aws-cdk/core';
import {Vpc} from '@aws-cdk/aws-ec2'
export class CipherLaunchVPC extends cdk.Stack {
    readonly vpc: Vpc
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.vpc = new Vpc(this, id, { maxAzs: 2 });
    }

}
