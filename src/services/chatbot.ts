import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { ChatMessage, ChatSession, ResponseStyle } from '../types';
import { bedrockClient, awsConfig, BEDROCK_MODEL_ID, BEDROCK_MAX_TOKENS, BEDROCK_TEMPERATURE, OPENSEARCH_INDEX } from '../config/aws';

interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: {
    title?: string;
    description?: string;
  };
}

export class Chatbot {
  private bedrockClient: BedrockRuntimeClient;
  private opensearchClient: Client;
  private responseStyle: ResponseStyle;

  constructor(responseStyle: ResponseStyle = 'formal') {
    this.bedrockClient = bedrockClient;
    this.opensearchClient = new Client({
      ...AwsSigv4Signer({
        region: awsConfig.region,
        credentials: awsConfig.credentials,
      }),
      node: `https://${process.env.OPENSEARCH_ENDPOINT}`,
    });
    this.responseStyle = responseStyle;
  }

  async generateResponse(session: ChatSession, userMessage: string): Promise<ChatMessage> {
    // 関連ドキュメントの検索
    const relevantDocs = await this.searchRelevantDocuments(userMessage);
    
    // プロンプトの構築
    const prompt = this.buildPrompt(session, userMessage, relevantDocs);
    
    // Bedrockを使用して応答を生成
    const response = await this.bedrockClient.send(new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      body: JSON.stringify({
        prompt,
        max_tokens: BEDROCK_MAX_TOKENS,
        temperature: BEDROCK_TEMPERATURE,
        stop_sequences: ['\n\nHuman:'],
      }),
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const assistantMessage: ChatMessage = {
      id: `${Date.now()}`,
      sessionId: session.id,
      role: 'assistant',
      content: responseBody.completion,
      timestamp: new Date(),
      metadata: {
        documentIds: relevantDocs.map(doc => doc.id),
      },
    };

    return assistantMessage;
  }

  private async searchRelevantDocuments(query: string): Promise<SearchResult[]> {
    const response = await this.opensearchClient.search({
      index: OPENSEARCH_INDEX,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['content', 'metadata.title', 'metadata.description'],
            type: 'best_fields',
          },
        },
        size: 5,
      },
    });

    return response.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      content: hit._source.content,
      metadata: hit._source.metadata,
    }));
  }

  private buildPrompt(session: ChatSession, userMessage: string, relevantDocs: SearchResult[]): string {
    const style = this.responseStyle === 'formal' ? '丁寧で専門的な' : '親しみやすい';
    
    let prompt = `あなたは${style}AIアシスタントです。以下の情報を参考に、ユーザーの質問に答えてください。\n\n`;
    
    if (relevantDocs.length > 0) {
      prompt += '参考情報:\n';
      relevantDocs.forEach(doc => {
        prompt += `- ${doc.content}\n`;
      });
      prompt += '\n';
    }

    prompt += '会話履歴:\n';
    session.messages.slice(-5).forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
    });

    prompt += `\nHuman: ${userMessage}\nAssistant:`;

    return prompt;
  }
} 