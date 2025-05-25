import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  appStack: cdk.Stack;
  service: ecs.FargateService;
}
// AWS SDKのバージョンを固定するためのpackage.jsonの依存関係を定義
const packageJson = {
  dependencies: {
    "@aws-sdk/client-opensearchserverless": "^3.812.0",
    // その他の依存関係も必要に応じて追加
  }
};

// CodeBuildプロジェクトのbuildSpecを更新
const buildSpec = codebuild.BuildSpec.fromObject({
  version: '0.2',
  phases: {
    install: {
      'runtime-versions': {
        nodejs: '18',
      },
      commands: [
        'npm install -g aws-cdk',
        // package.jsonを生成してからnpm installを実行
        `echo '${JSON.stringify(packageJson, null, 2)}' > package.json`,
        'npm install',
        'npm install --package-lock-only', // package-lock.jsonを更新
      ],
    },
    // ... 他のフェーズは変更なし
  }
});

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // GitHub接続用のシークレット
    const githubToken = cdk.SecretValue.secretsManager('github-token', {
      jsonField: 'token',
    });

    // CodeBuildプロジェクトの作成
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Dockerビルド用
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'npm install -g aws-cdk',
              'npm install',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'cd infrastructure && npm install',
              'cdk deploy AIChatbotAppStack --require-approval never',
            ],
          },
          post_build: {
            commands: [
              'chmod +x ./infrastructure/scripts/push-image.sh',
              './infrastructure/scripts/push-image.sh',
              'repositoryUri=$(aws ecr describe-repositories --repository-names ai-chatbot-app --region $AWS_DEFAULT_REGION --query "repositories[0].repositoryUri" --output text) && echo "[{\\"name\\":\\"web\\",\\"imageUri\\":\\"${repositoryUri}:latest\\"}]" > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
            'imagedefinitions.json'
          ]
        },
      }),
    });

    // ECRリポジトリへのプッシュ権限を付与
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:GetRepositoryPolicy',
        'ecr:DescribeRepositories',
        'ecr:ListImages',
        'ecr:DescribeImages',
        'ecr:BatchGetImage',
        'ecr:InitiateLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:CompleteLayerUpload',
        'ecr:PutImage',
      ],
      resources: ['*'],
    }));

    // CDKデプロイ権限を付与
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cloudformation:*',
        'ecs:*',
        'ecr:*',
        'iam:*',
        'logs:*',
        's3:*',
        'ssm:*',
      ],
      resources: ['*'],
    }));

    // パイプラインの作成
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'AIChatbotPipeline',
      crossAccountKeys: false,
    });

    // ソースステージ
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'Source',
      owner: 'keikapi', // GitHubのユーザー名または組織名
      repo: 'AIApp', // リポジトリ名
      branch: 'main',
      oauthToken: githubToken,
      output: sourceOutput,
    });
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // ビルドステージ
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'BuildAndDeploy',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });
    pipeline.addStage({
      stageName: 'BuildAndDeploy',
      actions: [buildAction],
    });

    const deployAction = new ecs_actions.EcsDeployAction({
      actionName: 'DeployToECS',
      service: props.service,
      input: buildOutput,
    });
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });
  }
} 