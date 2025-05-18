import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export class AiSearchStack extends cdk.Stack {
  public readonly collection: opensearch.CfnCollection;
  public readonly documentProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 暗号化ポリシーの作成
    const encryptionPolicy = new opensearch.CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: 'document-encryption-policy',
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [{
          Resource: ['collection/document-collection'],
          ResourceType: 'collection'
        }],
        AWSOwnedKey: true
      })
    });

    // コレクションの作成
    this.collection = new opensearch.CfnCollection(this, 'DocumentCollection', {
      name: 'document-collection',
      description: 'Document collection for AI chatbot',
      type: 'SEARCH',
      standbyReplicas: 'DISABLED'
    });

    // コレクションは暗号化ポリシーの後に作成
    this.collection.addDependency(encryptionPolicy);

    // Lambda関数の作成
    this.documentProcessor = new lambda.Function(this, 'DocumentProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/document-processor')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        OPENSEARCH_ENDPOINT: this.collection.attrCollectionEndpoint,
      },
    });

    // Lambda関数に必要な権限を付与
    this.documentProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'aoss:CreateIndex',
        'aoss:DeleteIndex',
        'aoss:UpdateIndex',
        'aoss:DescribeIndex',
        'aoss:ReadDocument',
        'aoss:WriteDocument',
        'aoss:CreateSecurityPolicy',
        'aoss:GetSecurityPolicy',
        'aoss:UpdateSecurityPolicy',
        'aoss:BatchGetDocument',
        'aoss:BatchPutDocument'
      ],
      resources: [this.collection.attrArn]
    }));

    this.documentProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:ListFoundationModels'
      ],
      resources: ['*']
    }));

    // タグ付け
    cdk.Tags.of(this).add('Project', 'AIChatbot');
    cdk.Tags.of(this).add('Environment', 'Production');
  }
} 