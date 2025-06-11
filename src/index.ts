import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

import express from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";


// MCP 서버 생성
const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0"
});



// 덧셈 도구 추가
server.tool(
  "add",                                    // 도구 이름
  {                                        // 입력 스키마
    a: z.number().describe("첫 번째 숫자"),
    b: z.number().describe("두 번째 숫자")
  },
  async ({ a, b }) => {                   // 실행 함수
    const result = a + b;
    return {
      content: [{
        type: "text",
        text: `${a} + ${b} = ${result}, wonderful result!@@@@ fsd `
      }]
    };
  }
);

// 곱셈 도구 추가
server.tool(
  "multiply",
  {
    x: z.number().describe("첫 번째 숫자"),
    y: z.number().describe("두 번째 숫자")
  },
  async ({ x, y }) => {
    const result = x * y;
    return {
      content: [{
        type: "text",
        text: `${x} × ${y} = ${result}`
      }]
    };
  }
);

server.tool(
  "greetmsg",
  {
    x: z.string().describe("name")
  },
  async ({ x }) => {
    const result = "반가워요";
    return {
      content: [{
        type: "text",
        text: `${x} 님 ${result}`
      }]
    };
  }
);

// 날씨 정보 도구
server.tool(
  "get-weather",
  {
    city: z.string().describe("날씨를 조회할 도시명")
  },
  async ({ city }) => {
    try {
      // 1. 도시명 → 위도/경도
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json() as { results?: { latitude: number, longitude: number }[] };

      if (!geoData.results || geoData.results.length === 0) {
        return {
          content: [{
            type: "text",
            text: `도시 '${city}'에 대한 정보를 찾을 수 없습니다.`
          }]
        };
      }

      const { latitude, longitude } = geoData.results[0];

      const weatherRes  = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      const weatherData = await weatherRes.json() as { current_weather: { temperature: number, windspeed: number } };
      const weather = weatherData.current_weather;

      return {
        content: [{
          type: "text",
          text: `${city}의 current:\n temperature: ${weather.temperature}°C\nwind speed: ${weather.windspeed} km/h`

          
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `날씨 조회 오류: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// logging helper
// Make sure all logging/console output goes to stderr, not stdout
const logger = {
  info: (message: string, data?: any) => {
    console.error(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
    }
  }
};

// logging tool
server.tool(
  "debug-example",
  { input: z.string() },
  async ({ input }) => {
    logger.info('debug-example call', { input });
    
    try {
      // 작업 수행
      const result = `process input ${input}`;
      logger.info('debug-example success', { result });
      
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error: unknown) {
      logger.error('debug-example error', error);
      return {
        content: [{ 
          type: "text", 
          text: `Error processing input: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// 정적 리소스 - 서버 정보
server.resource(
  "server-info",
  "info://server",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "이것은 나의 첫 번째 first MCP 서버입니다!\n버전: 1.0.0\n기능: 계산기"
    }]
  })
);

// 동적 리소스 - 사용자 인사말
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `안녕하세요!!!, ${name}님! MCP 서버에 오신 것을 환영합니다.`
    }]
  })
);

// 코드 리뷰 프롬프트
/*
server.prompt(
  "code-review",
  {
    code: z.string().describe("리뷰할 코드"),
    language: z.string().optional().describe("프로그래밍 언어")
  },
  ({ code, language }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `다음 ${language || ''}코드를 리뷰해주세요:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    }]
  })
);
*/

// 메모리 효율적인 대용량 파일 처리
server.tool(
  "process-large-file",
  { filePath: z.string() },
  async ({ filePath }) => {
    const { createReadStream } = await import('fs');
    const { createInterface } = await import('readline');

    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let sampleLines: string[] = [];

    for await (const line of rl) {
      lineCount++;
      if (sampleLines.length < 5) {
        sampleLines.push(line);
      }
    }

    return {
      content: [{
        type: "text",
        text: `파일 분석 완료:\n총 라인 수: ${lineCount}\n샘플 라인들:\n${sampleLines.join('\n')}`
      }]
    };
  }
);

// Stdio 전송 계층 설정

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP 서버가 시작되었습니다!");


/*
const app = express();
app.use(express.json());

// 간단한 무상태 서버 예제
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined  // 무상태 서버
});


const PORT = process.env.PORT || 3000;
await server.connect(transport);

app.listen(PORT, () => {
  console.log(`MCP 서버가 포트 ${PORT}에서 실행 중입니다`);
});
*/
