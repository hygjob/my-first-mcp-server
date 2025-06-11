# Anthropic MCP TypeScript 서버 초보자 개발 가이드
2025.6.11

## 목차
1. [MCP란 무엇인가?](#1-mcp란-무엇인가)
2. [개발환경 설정](#2-개발환경-설정)
3. [첫 번째 MCP 서버 만들기](#3-첫-번째-mcp-서버-만들기)
4. [실무 활용 예제](#4-실무-활용-예제)
5. [배포 및 디버깅](#5-배포-및-디버깅)

---

## 1. MCP란 무엇인가?

### 1.1 Model Context Protocol 개요
MCP(Model Context Protocol)는 Anthropic에서 개발한 오픈 표준으로, AI 애플리케이션이 외부 데이터 소스 및 도구와 표준화된 방식으로 연결될 수 있도록 해주는 프로토콜입니다. MCP는 AI 애플리케이션의 USB-C 포트라고 생각하면 됩니다.

### 1.2 왜 MCP가 필요한가?
기존에는 LLM과 다양한 데이터 소스를 연결하려면 각각 커스텀 커넥터를 개발해야 했습니다. 이는 'M×N 문제'라고 불리는 상황을 만들었습니다:
- M개의 AI 애플리케이션
- N개의 도구/시스템  
- M×N개의 통합 구현이 필요

MCP는 이를 'M+N 문제'로 변환합니다. 도구 제작자는 N개의 MCP 서버를, 애플리케이션 개발자는 M개의 MCP 클라이언트만 구축하면 됩니다.

### 1.3 MCP 아키텍처
MCP는 클라이언트-서버 아키텍처를 따릅니다:

```
[Host Application] ←→ [MCP Client] ←→ [MCP Server] ←→ [Data Sources]
```

- **MCP Host**: Claude Desktop, IDE, AI 도구 등 
- **MCP Client**: 서버와 1:1 연결을 유지하는 프로토콜 클라이언트
- **MCP Server**: 표준화된 MCP를 통해 특정 기능을 노출하는 경량 프로그램

### 1.4 MCP의 핵심 구성요소
MCP는 세 가지 주요 기본 요소를 제공합니다:

1. **Resources**: GET 엔드포인트와 유사, LLM 컨텍스트에 정보 로드
2. **Tools**: POST 엔드포인트와 유사, 코드 실행 또는 부작용 발생
3. **Prompts**: LLM 상호작용을 위한 재사용 가능한 템플릿

---

## 2. 개발환경 설정

### 2.1 필수 요구사항
다음 프로그램들이 설치되어 있어야 합니다:

```bash
# Node.js 20 이상 버전 확인
node --version

# npm 버전 확인  
npm --version

# TypeScript 전역 설치 (선택사항)
npm install -g typescript
```

### 2.2 프로젝트 초기화
새로운 MCP 서버 프로젝트를 생성합니다:

```bash
# 프로젝트 디렉토리 생성
mkdir my-first-mcp-server
cd my-first-mcp-server

# package.json 초기화
npm init -y
```

### 2.3 필수 의존성 설치
MCP TypeScript SDK와 필요한 패키지들을 설치합니다:

```bash
# MCP SDK 설치
npm install @modelcontextprotocol/sdk

# TypeScript 개발 도구 설치
npm install -D typescript @types/node ts-node nodemon

# 스키마 검증을 위한 zod 설치
npm install zod
```

### 2.4 TypeScript 설정
`tsconfig.json` 파일을 생성합니다:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.5 프로젝트 구조 설정
```
my-first-mcp-server/
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. 첫 번째 MCP 서버 만들기

### 3.1 기본 서버 구조
`src/index.ts` 파일을 생성하고 기본 서버를 구현합니다:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// MCP 서버 생성
const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0"
});

console.log("MCP 서버가 시작되었습니다!");

// Stdio 전송 계층 설정
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 3.2 첫 번째 Tool 추가
계산기 도구를 추가해보겠습니다:

```typescript
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
        text: `${a} + ${b} = ${result}`
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
```

### 3.3 Resource 추가하기
정적 및 동적 리소스를 추가합니다:

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// 정적 리소스 - 서버 정보
server.resource(
  "server-info",
  "info://server",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "이것은 나의 첫 번째 MCP 서버입니다!\n버전: 1.0.0\n기능: 계산기"
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
      text: `안녕하세요, ${name}님! MCP 서버에 오신 것을 환영합니다.`
    }]
  })
);
```

### 3.4 Prompt 추가하기
재사용 가능한 프롬프트 템플릿을 추가합니다:

```typescript
// 코드 리뷰 프롬프트
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
```

### 3.5 package.json 스크립트 설정
개발 편의를 위한 스크립트를 추가합니다:

```json
{
  "type": "module",
  "bin": {
    "my-first-server": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "inspect": "npx @modelcontextprotocol/inspector src/index.ts"
  }
}
```

### 3.6 서버 테스트
claude desktop을 사용하여 서버를 테스트할 수 있습니다:

```bash
# mcp 서버 빌드
npm run build
```

결과물 파일이 dist/index.js에 생깁니다.

[claude_desktop_config.json]

다음과 같이 전체 경로를 본인에게 맞게 추가합니다.

```json
{
	"mcpServers": {	
		"my-first-mcp": {
			"command": "node",
			"args": [ 
				"/yourpath/dist/index.js"
			]
		}
	}
}
```

clause desktop을 다시 시작합니다.

add 와 multiply를 테스트 해 보겠습니다.

```
claude$ add(10,20)
```



```
claude$ multiply(30,40)
```




---



## 4. 실무 활용 예제

### 4.1 파일 시스템 도구
실제 파일 시스템과 상호작용하는 도구를 만들어보겠습니다:

```typescript
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

// 파일 읽기 도구
server.tool(
  "read-file",
  {
    path: z.string().describe("읽을 파일의 경로")
  },
  async ({ path }) => {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return {
        content: [{
          type: "text",
          text: `파일 내용:\n\n${content}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `파일 읽기 오류: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 파일 목록 도구
server.tool(
  "list-files",
  {
    directory: z.string().describe("조회할 디렉토리 경로")
  },
  async ({ directory }) => {
    try {
      const files = await fs.readdir(directory);
      const fileList = files.join('\n');
      return {
        content: [{
          type: "text",
          text: `${directory} 디렉토리의 파일들:\n\n${fileList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `디렉토리 조회 오류: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

### 4.2 HTTP API 연동
외부 API와 연동하는 도구를 구현합니다:

```typescript
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
          text: `${city}의 현재 날씨:\n온도: ${weather.temperature}°C\n풍속: ${weather.windspeed} km/h`
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
```



```
claude$ get-weather(seoul)
```




---

## 5. 배포 및 디버깅

### 5.1 Claude Desktop과 연동
Claude Desktop에서 MCP 서버를 사용하려면 설정 파일을 수정해야 합니다.

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "my-first-server": {
      "command": "node",
      "args": ["/path/to/your/project/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

개발 중에는 다음과 같이 설정할 수도 있습니다:

```json
{
  "mcpServers": {
    "my-first-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/your/project/src/index.ts"]
    }
  }
}
```



코드가 수정되면 ctrl + R를 누르거나 claude desktop 재시작을 하여 코드 변경사항을 확인할 수 있습니다.



### 5.2 디버깅 및 로깅

효과적인 디버깅을 위한 로깅 시스템을 구축합니다:

```typescript

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

```

## 마무리

이 가이드를 통해 TypeScript로 MCP 서버를 개발하는 기본기를 익혔습니다. MCP는 AI와 도구 통합의 새로운 표준이 되고 있으며, 계속해서 발전하는 생태계입니다.

### 유용한 리소스
- [MCP 공식 문서](https://modelcontextprotocol.io)
- [TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [커뮤니티 서버 모음](https://github.com/modelcontextprotocol/servers)

MCP의 세계에서 여러분만의 혁신적인 도구를 만들어보세요!
