# JavaScript 与 Electron 应用产物

对于需要恢复可读源码的已捕获或已打包 JavaScript，使用
`recover_javascript_sources`，提供绝对 `path`，并省略
`output_directory`。当已声明支持时，在
`additional_paths` 中提供相关的运行时/共享/惰性文件，然后一起分析返回的 `analysis_input`
目录。每个输入都保留各自的快照、摘要（digest）与字节区间
溯源；输入和恢复出的代码永不执行。恢复要求调用方在 Linux x64 上提供 Wakaru；参见[恢复指南](https://github.com/hubooooooo/chaichai/blob/main/docs/javascript-recovery.md)。

对操作者提供的 ASAR 或解包目录直接使用 `analyze_javascript_application`。当问题涉及已知源码路径、且已连接的
schema 声明了 `source_paths` 时，选择清单中精确的路径，如
`["package.json", "main.js", "preload.js"]`。显式包含辅助清单文件或
source map；依赖不会被隐式分析。ChaiChai 保留完整的产物清单和身份，但只读取所选文件的源码文本并进行分析。结果和摘要都会记录 `source_selection`；范围之外的文件及其关系仍为未知，因此应用覆盖不完整并不意味着所选源码分析失败。在任一静态应用 CLI 路径上使用重复的 `--source-path`。
当问题需要完整应用分析时，省略该选择。`detail: "summary"` 减少交付
内容，但其本身不会减少分析工作量。

精确的 `#alias` 说明符通过导入方所在包的 `imports` 映射解析为包内本地文件；嵌套的 `node_modules` 包使用各自的映射。通配符、递归和外部包的导入目标保持未解析，即存在此限制。当大小未知或较大、且已连接的 schema 声明了
`detail` 时，请求 `detail: "summary"`。这会返回一条独立的 `inspect_analysis_view`
证据记录，并带有 `normalized_result.parent_evidence_id`，
指向完整保留的应用分析。source map 内容是该静态分析的一部分。先阅读结论、覆盖范围、限制和未知项，再追问某个具体的未回答问题。不支持 `detail` 的旧服务器在内容放得下时内联返回完整的应用证据。

当已连接的 schema 声明 `max_heap_mb` 和 `analysis_timeout_ms` 时，
它们分别选择隔离源码分析器的 old-space 堆和每个源码的
超时时间。默认值分别为 1024 MiB 和 300000 ms。它们不会改变 MCP
进程的堆。以 Bun 托管的 ChaiChai 不强制执行该堆选择；在 Windows 上，它
改为把分析器的已提交内存限制为该选择加上 512 MiB 的
运行时预留。

受资源限制的分析会保留已完成的静态事实，
并报告带有具体未知范围的部分语义覆盖；这并不意味着
源码有问题。重试某个源码之前，先检查这些限制。当展开后的关系超出父级可用内存时，查看该文件的 modules 条目视图所保留的 `static_analysis` 和
`semantic_module_analysis`。即使图链接未知，这些事实仍然可用。累积结果耗尽可能在检查完每个文件之前停止分析；清单和剩余的未知范围可以区分这种情况。源码分析开始后的超时或取消会在同一会话中保留部分证据。返回的 `error.details.partial_observation` 引用
可以直接提供给 `inspect_analysis_view`。如果 SDK 在本地取消，先从
证据包中取回其记录的 ID，再检查部分分析。

## 无需重复分析即可读取模块

在同一连接上，将实际返回的父级 ID 用作 `source.evidence_id`。
以下 ID 均为占位符，请替换为实际返回的值。当模块的节点 ID 尚不明确时，先分页列出标识，再选择条目。分页只返回节点 ID、路径和角色；选择合适的页大小，需要后续页时遵循
`coverage.next_offset`：

```json
{
  "source": {
    "kind": "retained-evidence",
    "evidence_id": "ev_ACTUAL_PARENT_ID"
  },
  "view": { "kind": "page", "collection": "modules", "offset": 0, "limit": 16 }
}
```

按精确的 `node_id` 和记录的角色选择相关的分页条目：

```json
{
  "source": {
    "kind": "retained-evidence",
    "evidence_id": "ev_ACTUAL_PARENT_ID"
  },
  "view": {
    "kind": "item",
    "collection": "modules",
    "selector": { "node_id": "jag_node_ACTUAL_NODE_ID" }
  }
}
```

模块分页包含 asset、bundled 和 source 模块角色，因此一个路径可能对应多个条目。只有在唯一性已确立时才使用 `selector.path`；
返回的节点 ID 无需完整清单即可证明唯一性。存在歧义时，
从分页或错误的候选列表中选择匹配的节点 ID。需要后续页时遵循
`next_offset`。条目展示该模块节点记录下的观察、身份、哈希、导出和源码范围；它不包含每个子语法观察、相关边或原始源码文件。条目缺少某项事实，并不能证明整个应用中不存在该项。

## 只追踪剩余的问题

在父级应用证据上使用 `trace_application_feature`，种子为一个
字面量节点 ID、路由、字符串、API、IPC 通道、模块或原生导出。
指向种子的关系选 `incoming`，离开种子的关系选
`outgoing`，问题两者都需要时选 `both`。追踪遍历包含
包含关系，因此即使种子很窄也可能扩展出大量节点；双
向追踪可能到达无关的兄弟模块。当模块条目或分页中的观察已能回答问题时，优先使用它们。不要把所有到达的节点都当作该功能的参与者。

当服务器声明支持时，复用保留的父级证据，或内联提供完整
证据。仅当其产物摘要完全匹配时，才包含 Hopper 或 Ghidra 证据。

## 处理超大的显示结果

超大响应会报告 `resource_constraint` 和
`details.resource: "transport"`。将
`details.reported_limits.evidence_reference` 与 `inspect_analysis_view` 配合使用，获取摘要、单个模块或一页稳定的模块标识。
`export_evidence_bundle` 将完整的规范会话写入调用方选择的文件。这些工作流保留原始证据和覆盖范围；宽泛的后续请求也可能再次超出框架限制。

客户端可能在文本信封内部截断成功结果，而不触发 ChaiChai 的 `resource_constraint`。把截断提示或不完整的 JSON 视为显示限制；不要声称已检查完整记录。用已知的父级 ID 获取较小的视图，或在会话仍打开时将完整证据导出到指定文件。如果父级 ID 在预览中丢失，
用先前的分析摘要或明确的台账记录找回它；不要编造 ID，也不要为了重现同一份显示而重新运行分析。

BrowserWindow 偏好、preload 与 contextBridge 暴露面、IPC
注册、工具进程和原生绑定请求都是静态语法观察。只有唯一且精确的字面量 IPC 通道匹配才支持推断配对。动态或存在歧义的通道保持未解析。被请求的 `.node`
成员不是经过验证的原生导出。绝不要依据静态分析声称运行时可到达性、
注册、默认值或策略执行。

做版本比较时，每个版本各分析一次，然后调用
`compare_application_versions`。只接受其摘要、source map、结构指纹或非模块语义匹配。模块序号和压缩后的名称不是持久身份。只有在另一侧覆盖完整时才能报告新增或移除；否则报告未知。

当问题询问某个精确的导出可调用对象的返回对象形状如何变化时，每个版本各分析一次，然后用显式的模块路径和导出名调用
`compare_javascript_export_shapes`。使用两次分析调用在同一连接上返回的 ID，或内联完整证据记录。只有通过该工具唯一的精确字面量判别式才接受变体配对。在把 `unknown` 当作"该名称未被观察到"之前，先读
`property_inventories` 和每个变化的 `presence`：即使值保持未知，清单也会列出已观察到的属性名，并为每个已配对或未配对的变体给出 `source_range`。数组空洞和被修改失效的槽位不是已观察到的属性。父级覆盖完整时会报告仅有 presence 信息的
`added`/`removed`，与未解析的值无关。引用比较证据并报告 JSON Pointer 变化；动态值、歧义变体
和不完整的父级属性覆盖保持未知。这是静态推断，不是运行时行为。需要运行语义时，对相关应用版本运行行为探针，并通过可用的浏览器、Electron 或进程工作流捕获它们。

## 复用应用证据

当已连接的服务器声明支持时，应用追踪和比较工具接受内联完整证据，或其应用输入（`application`，或 `left`/`right`）使用
`{"kind":"retained-evidence","evidence_id":"ev_<64 lowercase hex characters>"}`。`inspect_analysis_view`
在 `source` 中使用相同的保留引用形式，或使用可携带的内联证据，来投射摘要、模块分页或某个模块及其记录下的观察。该记法是一个模板：请替换为实际返回的 ID。4.1.0 之前的版本只接受完整内联证据。使用生产方在同一 MCP 连接上返回的精确 ID。解析不会运行分析或选择提供方；结论保持内联。原生观察数组仍需要完整证据。`close_binary` 会清除保留引用；
先导出证据包再关闭，或在另一条连接中提供可携带的内联证据。缺失的引用会包含其 ID 和恢复指引。
