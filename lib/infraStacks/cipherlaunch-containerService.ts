import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns'
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
const ECRRepoName = "clapi"

const StageGraphQLARNMappings = new Map<string,string>([
    ["dev", "arn:aws:appsync:us-west-2:342243318645:apis/uezpj4ilpnejddwt7f32uo4xsm"]
]
);

export interface CipherLaunchContainerServiceProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    stage: string;
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
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.A1, ec2.InstanceSize.XLARGE4),
        machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
        desiredCapacity: 2,
        minCapacity: 1,
        maxCapacity: 100
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgCapacityProvider', {
        autoScalingGroup,
      });
    
    cluster.addAsgCapacityProvider(capacityProvider);

    
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');
    
    taskDefinition.addContainer('Container', {
        image: ecs.ContainerImage.fromEcrRepository(repository),
        memoryLimitMiB: 512,
        environment: {
            STAGE: props.stage
        },
        logging: new ecs.AwsLogDriver({
            streamPrefix: ECRRepoName
        }),
        portMappings: [{
            containerPort: 3000
        }]
    });

    taskDefinition.addToTaskRolePolicy(
        new PolicyStatement({
            effect: Effect.ALLOW, 
            actions: ["s3:*"],
            resources: ["*"]
        })
    );

    const graphQLARN = StageGraphQLARNMappings.get(props.stage)!
    taskDefinition.addToTaskRolePolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["appsync:GraphQL"],
            resources: [
                graphQLARN,
                `${graphQLARN}/types/*/fields/*`
            ]
        })
    );
    
    const ecsService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'Service', {
        cluster: cluster,
        taskDefinition: taskDefinition,
        desiredCount: 1
    });

    }
}