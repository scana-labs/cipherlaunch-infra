import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { SubnetType } from '@aws-cdk/aws-ec2';
const ECRRepoName = "clapi"

const StageGraphQLARNMappings = new Map<string, string>([
    ["dev", "arn:aws:appsync:us-west-2:342243318645:apis/uezpj4ilpnejddwt7f32uo4xsm/*"]
]);

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

        const albSecurityGroup = new ec2.SecurityGroup(this, 'albSecurityGroup', {
            vpc: props.vpc,
            description: 'ALB default security group',
            allowAllOutbound: true,   // Can be set to false
        });

        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow all ipv4 http traffic');
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow all ipv4 https traffic');

        const asgInstanceSecurityGroup = new ec2.SecurityGroup(this, 'asgInstanceSecurityGroup', {
            vpc: props.vpc,
            description: 'ASG Instance default security group',
            allowAllOutbound: true,   // Can be set to false
        });

        asgInstanceSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcpRange(49153, 65535), 'Allow all http traffic from ALB on ephemeral dynamic ports');

        const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc: props.vpc,
            healthCheck: autoscaling.HealthCheck.elb({ grace: cdk.Duration.seconds(300) }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.A1, ec2.InstanceSize.XLARGE4),
            machineImage: ecs.EcsOptimizedImage.amazonLinux2(ecs.AmiHardwareType.ARM),
            desiredCapacity: 2,
            keyName: "cl-eng",
            minCapacity: 1,
            maxCapacity: 100,
            securityGroup: asgInstanceSecurityGroup,
        });

        const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgCapacityProvider', {
            autoScalingGroup,
        });

        cluster.addAsgCapacityProvider(capacityProvider);

        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');

        taskDefinition.addContainer('Container', {
            image: ecs.ContainerImage.fromEcrRepository(repository),
            healthCheck: {
                command: ["CMD-SHELL", "curl -f http://localhost:80/health || exit 1"],
                interval: cdk.Duration.seconds(30),
                retries: 10,
                startPeriod: cdk.Duration.seconds(10),
                timeout: cdk.Duration.seconds(10)
            },
            memoryLimitMiB: 14305,
            environment: {
                STAGE: props.stage
            },
            logging: new ecs.AwsLogDriver({
                streamPrefix: ECRRepoName
            }),
            portMappings: [{
                containerPort: 80
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
                    graphQLARN
                ]
            })
        );

        // Create ALB
        const alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
            vpc: props.vpc,
            internetFacing: true,
            securityGroup: albSecurityGroup,
        });

        const ecsService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'Service', {
            cluster: cluster,
            taskDefinition: taskDefinition,
            desiredCount: 1,
            loadBalancer: alb,
        });

        ecsService.targetGroup.configureHealthCheck({
            path: '/health',
            unhealthyThresholdCount: 2,
            healthyThresholdCount: 5,
            interval: cdk.Duration.seconds(30),
        });
    }
}