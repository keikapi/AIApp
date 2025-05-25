#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BaseStack } from '../lib/stacks/base-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { AiSearchStack } from '../lib/stacks/ai-search-stack';
import { AppStack } from '../lib/stacks/app-stack';
import { PipelineStack } from '../lib/stacks/pipeline-stack';

const app = new cdk.App();

// 環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// スタックの作成
const baseStack = new BaseStack(app, 'AIChatbotBaseStack', { env });
const storageStack = new StorageStack(app, 'AIChatbotStorageStack', { env });
const authStack = new AuthStack(app, 'AIChatbotAuthStack', { env });
const aiSearchStack = new AiSearchStack(app, 'AIChatbotAiSearchStack', { env });

// アプリケーションスタックの作成（依存関係を考慮）
const appStack = new AppStack(app, 'AIChatbotAppStack', {
  env,
  baseStack,
  storageStack,
  authStack,
  aiSearchStack,
});

// パイプラインスタックの作成
const pipelineStack = new PipelineStack(app, 'AIChatbotPipelineStack', {
  env,
  appStack,
  service: appStack.service.service,
});

// スタック間の依存関係を設定
appStack.addDependency(baseStack);
appStack.addDependency(storageStack);
appStack.addDependency(authStack);
appStack.addDependency(aiSearchStack);
pipelineStack.addDependency(appStack);