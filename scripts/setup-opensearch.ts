import { OpenSearchServerlessClient, CreateCollectionCommand, CreateSecurityPolicyCommand, CreateSecurityConfigCommand } from '@aws-sdk/client-opensearchserverless';
import { awsConfig } from '../src/config/aws';

async function setupOpenSearchServerless() {
  const client = new OpenSearchServerlessClient(awsConfig);
  const collectionName = 'ai-chatbot-collection';
  const policyName = 'ai-chatbot-policy';
  const configName = 'ai-chatbot-config';

  try {
    // セキュリティ設定の作成
    console.log('Creating security config...');
    await client.send(new CreateSecurityConfigCommand({
      name: configName,
      type: 'saml',
      samlOptions: {
        metadata: process.env.SAML_METADATA_URL,
        userAttribute: 'email',
        groupAttribute: 'groups',
      },
    }));

    // セキュリティポリシーの作成
    console.log('Creating security policy...');
    await client.send(new CreateSecurityPolicyCommand({
      name: policyName,
      type: 'data',
      policy: JSON.stringify({
        Rules: [
          {
            Resource: [`collection/${collectionName}`],
            Permission: [
              'aoss:CreateIndex',
              'aoss:DeleteIndex',
              'aoss:UpdateIndex',
              'aoss:DescribeIndex',
              'aoss:ReadDocument',
              'aoss:WriteDocument',
            ],
            ResourceType: 'collection',
          },
        ],
        Version: '2012-10-17',
      }),
    }));

    // コレクションの作成
    console.log('Creating collection...');
    const collection = await client.send(new CreateCollectionCommand({
      name: collectionName,
      description: 'AI Chatbot document collection',
      type: 'SEARCH',
      standbyReplicas: 'DISABLED',
    }));

    console.log('OpenSearch Serverless setup completed successfully!');
    console.log('Collection endpoint:', collection.createCollectionDetail?.endpoint);
    console.log('Please add the following to your .env file:');
    console.log(`OPENSEARCH_ENDPOINT=${collection.createCollectionDetail?.endpoint}`);
  } catch (error) {
    console.error('Error setting up OpenSearch Serverless:', error);
    throw error;
  }
}

setupOpenSearchServerless().catch(console.error); 