import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';

const ECRRepoName = "clapi"

export interface CipherLaunchContainerServiceProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}
export class CipherLaunchContainerService extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: CipherLaunchContainerServiceProps) {
        super(scope, id, props);

    const repository = new ecr.Repository(this, 'ECRRepo', {
        repositoryName: ECRRepoName
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
        vpc: props.vpc
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
        vpc: props.vpc,
        instanceType: new ec2.InstanceType('a1.4xlarge'),
        machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
        minCapacity: 0,
        maxCapacity: 100
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgCapacityProvider', {
        autoScalingGroup,
      });
    
      cluster.addAsgCapacityProvider(capacityProvider);

    
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');
    
    taskDefinition.addContainer('Container', {
        image: ecs.ContainerImage.fromEcrRepository(repository),
        memoryLimitMiB: 512
    });
    
    const ecsService = new ecs.Ec2Service(this, 'Service', {
        cluster,
        taskDefinition,
    });

    }
}