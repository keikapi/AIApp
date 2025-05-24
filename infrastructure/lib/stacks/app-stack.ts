import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';
import { StorageStack } from './storage-stack';
import { AuthStack } from './auth-stack';
import { AiSearchStack } from './ai-search-stack';

interface AppStackProps extends cdk.StackProps {
  baseStack: BaseStack;
  storageStack: StorageStack;
  authStack: AuthStack;
  aiSearchStack: AiSearchStack;
}

export class AppStack extends cdk.Stack {
  public readonly repository: ecr.IRepository;
  public readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;
  private readonly serviceSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // セキュリティグループの作成
    this.serviceSecurityGroup = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc: props.baseStack.vpc,
      description: 'Security group for AI Chatbot service',
      allowAllOutbound: true,
    });

    this.serviceSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.serviceSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // ECRリポジトリの作成
    this.repository = ecr.Repository.fromRepositoryName(this, 'Repository', 'ai-chatbot-app');

    // ECSクラスターの作成
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'ai-chatbot-cluster',
      vpc: props.baseStack.vpc,
    });

    // タスク実行ロールの作成
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // タスクロールの作成
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // 必要な権限を追加
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket',
      ],
      resources: [
        props.storageStack.documentsBucket.bucketArn,
        `${props.storageStack.documentsBucket.bucketArn}/*`,
      ],
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [
        props.storageStack.userSettingsTable.tableArn,
        props.storageStack.chatHistoryTable.tableArn,
      ],
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminRespondToAuthChallenge',
        'cognito-idp:AdminGetUser',
      ],
      resources: [
        props.authStack.userPool.userPoolArn,
      ],
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: ['*'],
    }));

    // Fargateサービスの作成
    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
        taskRole,
        executionRole: taskExecutionRole,
        environment: {
          USER_POOL_ID: props.authStack.userPool.userPoolId,
          USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
          DOCUMENTS_BUCKET: props.storageStack.documentsBucket.bucketName,
          USER_SETTINGS_TABLE: props.storageStack.userSettingsTable.tableName,
          CHAT_HISTORY_TABLE: props.storageStack.chatHistoryTable.tableName,
          OPENSEARCH_ENDPOINT: props.aiSearchStack.collection.attrCollectionEndpoint,
          NODE_ENV: 'production',
        },
        containerPort: 3000,
        enableLogging: true,
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: 'ai-chatbot',
          logRetention: logs.RetentionDays.ONE_WEEK,
        }),
      },
      desiredCount: 1,
      cpu: 1024,
      memoryLimitMiB: 2048,
      publicLoadBalancer: true,
      assignPublicIp: true,
      securityGroups: [this.serviceSecurityGroup],
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      circuitBreaker: { rollback: false },
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: cdk.Duration.seconds(300),
    });

    // ヘルスチェックの設定を調整
    this.service.targetGroup.configureHealthCheck({
      path: '/',
      healthyHttpCodes: '200,302',
      interval: cdk.Duration.seconds(60),
      timeout: cdk.Duration.seconds(30),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    });

    // ターゲットグループの設定を明示的に指定
    const targetGroup = this.service.targetGroup;
    targetGroup.setAttribute('deregistration_delay.timeout_seconds', '60');
    targetGroup.setAttribute('slow_start.duration_seconds', '60');
    targetGroup.setAttribute('stickiness.enabled', 'false');

    // オートスケーリングの設定を調整
    const scaling = this.service.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    // タグ付け
    cdk.Tags.of(this).add('Project', 'AI-Chatbot');
    cdk.Tags.of(this).add('Environment', 'Production');

    // 出力の設定
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.service.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
} 