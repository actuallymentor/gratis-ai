# RunPod API Research (2026-03-12)

## Two API surfaces

1. **Management API** (REST): `https://rest.runpod.io/v1/` -- manage endpoints, templates, pods
2. **Serverless Job API** (REST): `https://api.runpod.ai/v2/{endpoint_id}/` -- send inference requests
3. **Management API** (GraphQL, legacy): `https://api.runpod.io/graphql` -- still works, being replaced by REST

Auth for all: `Authorization: Bearer <API_KEY>`

---

## REST: Endpoint Management

### Create: POST /v1/endpoints
Required: `templateId` (string)
Optional: `name` (string, max 191), `computeType` (GPU|CPU, default GPU), `gpuCount` (int, default 1), `gpuTypeIds` (string[], priority order), `workersMin` (int), `workersMax` (int), `idleTimeout` (int, 1-3600, default 5), `scalerType` (QUEUE_DELAY|REQUEST_COUNT), `scalerValue` (int, default 4), `executionTimeoutMs` (int), `flashboot` (bool), `dataCenterIds` (string[]), `allowedCudaVersions` (string[]), `networkVolumeId` (string), `networkVolumeIds` (string[])

Response 200: Endpoint object (id, name, templateId, computeType, gpuCount, gpuTypeIds, workersMin, workersMax, idleTimeout, scalerType, scalerValue, executionTimeoutMs, dataCenterIds, networkVolumeId, networkVolumeIds, createdAt, userId, version, workers[], template{}, env{})

### List: GET /v1/endpoints?includeTemplate=bool&includeWorkers=bool
Response 200: array of Endpoint objects

### Get: GET /v1/endpoints/{endpointId}?includeTemplate=bool&includeWorkers=bool
Response 200: Endpoint object

### Update: PATCH /v1/endpoints/{endpointId}
Body: same fields as create (all optional)
Response 200: Endpoint object

### Delete: DELETE /v1/endpoints/{endpointId}
Response 204: no content

### Errors: 400 (bad input), 401 (unauthorized), 404 (not found)

---

## REST: Template Management

### Create: POST /v1/templates
Required: `name` (string, unique), `imageName` (string)
Optional: `category` (NVIDIA|AMD|CPU), `containerDiskInGb` (int), `volumeInGb` (int), `volumeMountPath` (string), `ports` (string[]), `env` (object {key:value}), `dockerEntrypoint` (string[]), `dockerStartCmd` (string[]), `readme` (string), `isPublic` (bool), `containerRegistryAuthId` (string)

### List: GET /v1/templates?includeRunpodTemplates=bool&includePublicTemplates=bool
Response 200: array of Template objects

### Template object: id, name, imageName, category, isPublic, isRunpod, isServerless, containerDiskInGb, volumeInGb, volumeMountPath, ports, env, dockerEntrypoint, dockerStartCmd, readme, earned, containerRegistryAuthId

---

## GraphQL: Endpoint Management (legacy, still works)

### saveEndpoint mutation
```graphql
mutation {
  saveEndpoint(input: {
    name: String!
    templateId: String!
    gpuIds: String!          # e.g. "AMPERE_16" -- note: STRING not array in GraphQL
    id: String               # omit to create, include to update
    idleTimeout: Int
    locations: String        # "CZ,FR,GB,NO,RO,US" or null for any
    networkVolumeId: String
    scalerType: String       # "QUEUE_DELAY"
    scalerValue: Int
    workersMin: Int
    workersMax: Int
  }) {
    id name gpuIds templateId idleTimeout locations
    networkVolumeId scalerType scalerValue workersMin workersMax
  }
}
```

### deleteEndpoint mutation
```graphql
mutation { deleteEndpoint(id: "endpoint_id") }
```
Note: workers min and max must both be 0 before deletion.

### Query endpoints
```graphql
query { myself { endpoints { id name gpuIds templateId workersMin workersMax ... } } }
```

---

## GraphQL: Template Management (legacy)

### saveTemplate mutation
```graphql
mutation {
  saveTemplate(input: {
    name: String!
    imageName: String!
    dockerArgs: String!
    containerDiskInGb: Int!
    volumeInGb: Int!           # 0 for serverless
    env: [{ key: String!, value: String! }]
    isServerless: Boolean
    ports: String
    readme: String
    volumeMountPath: String
    containerRegistryAuthId: String
  }) {
    id name imageName dockerArgs containerDiskInGb volumeInGb
    volumeMountPath ports readme isServerless env { key value }
  }
}
```

---

## GraphQL: GPU Types & Availability

```graphql
query { gpuTypes { id displayName memoryInGb secureCloud communityCloud lowestPrice(input: { gpuCount: 1 }) { minimumBidPrice uninterruptablePrice stockStatus } } }
```

`stockStatus` field on `lowestPrice` returns: `"High"`, `"Medium"`, `"Low"`, or null when GPU is unavailable.
Used in v0.27.0 to prioritise GPU selection by availability — pool availability = best status among its GPUs.

---

## GPU Pool IDs for Serverless

| Pool ID | GPUs | VRAM |
|---------|------|------|
| AMPERE_16 | A4000, A4500, RTX 4000, RTX 2000 | 16 GB |
| AMPERE_24 | L4, A5000, 3090 | 24 GB |
| ADA_24 | 4090 | 24 GB |
| AMPERE_48 | A6000, A40 | 48 GB |
| ADA_48_PRO | L40, L40S, 6000 Ada | 48 GB |
| AMPERE_80 | A100 | 80 GB |
| ADA_80_PRO | H100 | 80 GB |
| HOPPER_141 | H200 | 141 GB |

In GraphQL `saveEndpoint`: `gpuIds` is a **String** (single value like "AMPERE_16")
In REST `POST /endpoints`: `gpuTypeIds` is a **String[]** (array, priority order)

---

## Serverless Job API (inference)

Base: `https://api.runpod.ai/v2/{endpoint_id}/`

### POST /run (async)
Request: `{ input: {...}, webhook?: string, policy?: { executionTimeout, lowPriority, ttl }, s3Config?: {...} }`
Response: `{ id: string, status: "IN_QUEUE" }`
Rate: 1000 req/10s, 200 concurrent

### POST /runsync (sync)
Same request format.
Response: `{ id: string, status: "COMPLETED", output: any, delayTime: int(ms), executionTime: int(ms) }`
Rate: 2000 req/10s, 400 concurrent
Result retention: 1 min (up to 5 min with ?wait=t)

### GET /status/{job_id}
Response: `{ id, status, output?, delayTime?, executionTime? }`
Status values: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, TIMED_OUT

### GET /stream/{job_id}
Response: array of `{ output: any, metrics?: {...} }`

### POST /cancel/{job_id}
Response: `{ id, status: "CANCELLED" }`

### POST /retry/{job_id}
Response: `{ id, status: "IN_QUEUE" }`

### POST /purge-queue
Response: `{ removed: int, status: "completed" }`

### GET /health
Response:
```json
{
  "jobs": { "completed": 0, "failed": 0, "inProgress": 0, "inQueue": 0, "retried": 0 },
  "workers": { "idle": 0, "running": 0 }
}
```

### Error responses from jobs
Worker errors: `{ "error": "string message" }` in the output field, status = "FAILED"

---

## OpenAI-Compatible Endpoints (vLLM worker)

Base: `https://api.runpod.ai/v2/{endpoint_id}/openai/v1`
Auth: same Bearer token, passed as `api_key` in OpenAI client

### Supported paths
- POST /chat/completions
- POST /completions
- GET /models

### Chat completions request
```json
{
  "model": "HuggingFaceTB/SmolLM2-135M-Instruct",
  "messages": [{"role": "user", "content": "Say hi"}],
  "temperature": 0.7,
  "max_tokens": 500,
  "top_p": 1.0,
  "stream": true,
  "presence_penalty": 0.0,
  "frequency_penalty": 0.0,
  "n": 1,
  "stop": null
}
```

vLLM-extra params: best_of, top_k, repetition_penalty, min_p, use_beam_search, length_penalty, ignore_eos, skip_special_tokens, echo

### Non-streaming response
Standard OpenAI format:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1744199068,
  "model": "model-name",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "..." },
    "finish_reason": "stop"
  }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30 }
}
```

### Streaming SSE response
Each chunk: `data: {json}\n\n`
Final: `data: [DONE]\n\n`

Chunk format:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion.chunk",
  "created": 1744199068,
  "model": "model-name",
  "choices": [{
    "index": 0,
    "delta": { "content": "token" },
    "logprobs": null,
    "finish_reason": null
  }]
}
```
First chunk has `delta: { role: "assistant" }`, subsequent have `delta: { content: "..." }`, final has `finish_reason: "stop"`.

---

## vLLM Worker Docker Image

Image: `runpod/worker-v1-vllm:v2.4.0stable-cuda12.1.0`

### Key environment variables
| Var | Default | Description |
|-----|---------|-------------|
| MODEL_NAME | facebook/opt-125m | HuggingFace model ID |
| HF_TOKEN | - | For gated models |
| MAX_MODEL_LEN | auto | Max context length |
| DTYPE | auto | float16, bfloat16, auto |
| GPU_MEMORY_UTILIZATION | 0.95 | VRAM fraction |
| QUANTIZATION | null | awq, gptq, squeezellm, bitsandbytes |
| TENSOR_PARALLEL_SIZE | 1 | Multi-GPU sharding |
| MAX_CONCURRENCY | 30 | Concurrent requests per worker |
| RAW_OPENAI_OUTPUT | 1 | Raw SSE format |
| OPENAI_SERVED_MODEL_NAME_OVERRIDE | null | Custom model name in /models |
| TRUST_REMOTE_CODE | false | Trust HF remote code |
| CUSTOM_CHAT_TEMPLATE | null | Jinja2 chat template override |
| ENABLE_AUTO_TOOL_CHOICE | false | Auto tool calling |

### Template ID
No fixed public template ID. Two approaches:
1. Create your own template via `POST /v1/templates` with `imageName: "runpod/worker-v1-vllm:v2.4.0stable-cuda12.1.0"` and env vars
2. Use Quick Deploy in console (uses RunPod's internal template)
3. List RunPod templates via `GET /v1/templates?includeRunpodTemplates=true` and find vLLM

The `saveEndpoint` GraphQL example in docs uses `templateId: "xkhgg72fuo"` as a placeholder -- this is NOT the vLLM template ID, just an example.
