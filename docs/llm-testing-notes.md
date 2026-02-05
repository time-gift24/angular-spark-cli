# LLM Service Testing Notes

This document provides instructions for testing the LLM service integration.

## Configuration

### 1. Obtain an API Key

You'll need an API key from one of the supported providers:

#### Zhipu AI (智谱AI)
1. Visit [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
2. Register for an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key for configuration

#### OpenAI
1. Visit [https://platform.openai.com/](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key for configuration

#### Ollama (Local)
1. Install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Pull a model: `ollama pull llama2`
3. Ollama runs locally by default on `http://localhost:11434`
4. No API key required

### 2. Configure API Key

Edit `src/app/app.config.ts` and replace the placeholder:

```typescript
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'zhipu',  // or 'openai' or 'ollama'
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',  // or 'gpt-4', 'llama2', etc.
    apiKey: 'YOUR_ACTUAL_API_KEY_HERE'  // Replace this!
  }
}
```

**Important:** Never commit actual API keys to version control!

### 3. Configuration Examples

#### Zhipu AI Configuration
```typescript
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    apiKey: 'your-zhipu-api-key'
  }
}
```

#### OpenAI Configuration
```typescript
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    apiKey: 'your-openai-api-key'
  }
}
```

#### Ollama Configuration (Local)
```typescript
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    apiKey: ''  // No API key needed for Ollama
  }
}
```

## Running the Demo

### 1. Start the Development Server

```bash
npm run dev
```

Or with Ivy enabled:

```bash
ng serve
```

### 2. Navigate to the Demo

Open your browser and navigate to:

```
http://localhost:4200/demo/llm-chat
```

### 3. Test the Service

1. Enter a message in the text area
2. Click "Send Message"
3. Watch the streaming response appear
4. Try different prompts to test various scenarios

## Expected Behavior

### Successful Response

- Loading indicator appears while generating
- Response streams in character by character
- No errors displayed
- Response content is complete and formatted

### Error Handling

The demo should handle:

1. **Missing API Key**: Clear error message indicating configuration needed
2. **Invalid API Key**: Authentication error from the provider
3. **Network Issues**: Connection timeout or network error
4. **Rate Limiting**: Rate limit error from the provider
5. **Invalid Model**: Model not found or not accessible

### Loading States

- "Send Message" button disabled during generation
- Button text changes to "Sending..."
- Loading spinner displayed
- Input field disabled during generation

## Test Cases

### Basic Functionality

- [ ] Send a simple message ("Hello, how are you?")
- [ ] Send a longer message (multiple sentences)
- [ ] Send a message with special characters
- [ ] Clear chat after receiving response
- [ ] Send multiple messages in sequence

### Error Handling

- [ ] Test with invalid API key
- [ ] Test with missing API key
- [ ] Test with network disconnected (dev tools offline mode)
- [ ] Test with invalid model name

### Streaming Behavior

- [ ] Verify response appears character by character
- [ ] Verify streaming doesn't block UI
- [ ] Verify loading state updates correctly
- [ ] Verify can interrupt by clearing (future feature)

## Troubleshooting

### Issue: "Failed to fetch" Error

**Solution**: Check CORS settings for the API provider. Some providers require whitelisting your domain.

### Issue: 401 Unauthorized

**Solution**: Verify your API key is correct and has sufficient permissions.

### Issue: 429 Rate Limit Exceeded

**Solution**: You've hit the rate limit. Wait a few minutes before trying again.

### Issue: Model Not Found

**Solution**: Verify the model name is correct for your provider. Check provider documentation for available models.

### Issue: No Response Displayed

**Solution**: Open browser DevTools Console to check for errors. Verify the service is properly configured.

### Issue: Streaming Not Working

**Solution**: Some providers or models may not support streaming. Check provider documentation.

## Debug Mode

To enable debug logging, modify the LlmService to log requests and responses:

```typescript
// In llm.service.ts
console.log('Request:', messages);
console.log('Response:', chunk);
```

## Next Steps

After testing the demo:

1. Integrate the service into your actual components
2. Add conversation history management
3. Implement error recovery strategies
4. Add user feedback mechanisms
5. Consider adding streaming controls (pause/resume/stop)

## Additional Resources

- [Zhipu AI Documentation](https://open.bigmodel.cn/dev/api)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Angular Signals Documentation](https://angular.dev/guide/signals)
