---
name: reverse-engineer-anything
description: 使用 ChaiChai 逆向分析原生程序、托管程序、Electron/JavaScript、打包产物、固件和浏览器目标。使用已发布的产物或请求的运行时证据来解释功能、比较版本、反编译代码或指导重构。对普通源代码仓库的架构分析不要使用 ChaiChai。
metadata:
  version: "41"
---

# ChaiChai

当某个结论依赖于已发布的二进制文件或包、反编译、被动的应用运行时证据，或与现有源码无法确立的行为进行比较时，使用 ChaiChai。对完整源码仓库的普通分析，使用常规的仓库工具，不要运行 ChaiChai 的就绪检查或 provider 命令。

## 只在需要时连接

安装本技能只提供说明；它不会注册 ChaiChai MCP 服务器、安装分析引擎，也不会为正在运行的 agent 添加工具。

如果 ChaiChai 工具可用且其注册信息没有已知过期，直接开始处理目标。不要在每次调查前都运行诊断或安装。使用已连接服务器的实际工具列表和输入 schema；从仓库 main 分支安装的技能描述的某些能力可能不存在于较旧的 npm 发行版。当该服务器不提供保留引用（retained references）时，保留完整的内联 Evidence。

如果工具缺失、调用被客户端拦截，或必需的 provider 不可用，阅读[连接与恢复](references/connection-and-recovery.md)。诊断观察到的阻塞原因，继续完成有用的受支持工作，修复后恢复原始任务。客户端审批、shell PATH、注册信息和引擎可用性各有不同解决方法；不要对所有问题重复同一种安装流程。

优先使用已有的 `chaichai` CLI。当没有安装且 ChaiChai 包获取在授权范围内时，改用 `npx -y chaichai-ai@latest`。
配置修复从只读安装计划开始；展示路径、备份和技能替换内容，然后再应用授权的变更。保留现有的审批和目标执行边界。ChaiChai 的安装从不安装或升级无关软件，包括 Node.js、npm、Homebrew、Java、Ghidra、IDA、JADX、Binwalk 或 Unblob。

## 先为目标准备路由

从用户提供的目标准备路由中选择第一个工具。原生或归档工作流使用 `open_binary` 处理活动目标；无目标（target-free）工具使用各自显式的路径或端点，不需要目标。

- ASAR 或已解包的 JavaScript/Electron 目录树：
  `analyze_javascript_application`。
- 归档/包成员清单（ZIP/APK/IPA/MSIX/AppX 或 DMG）：
  `open_binary` 加上提供的本地路径；当它的图和发现有助于回答问题时，使用 `inspect_artifact`。
- Android APK 代码、类、方法或传入引用：
  `inspect_android_package`，然后在服务端提供时使用聚焦的 Android 工具。
  归档成员清单仍使用上面的归档路由。
- 托管 PE/CLI 程序集：`inspect_managed_artifact`。
- 固件镜像：在服务端提供时使用 `inspect_firmware_regions`。当请求提取时使用
  `extract_firmware`，输出到调用方选择的新绝对输出目录。这些工具在 Linux 上使用调用方提供的 Binwalk/Unblob；参见[固件指南](https://github.com/hubooooooo/chaichai/blob/main/docs/firmware-analysis.md)。
- .NET NativeAOT PE/ELF：原生 Ghidra 分析。原生代码可以得到伪代码；
  可参阅 `references/native-and-artifacts.md` 中的 NativeAOT 工作流，了解可选的元数据恢复及其支持的主机/布局边界。
- 用户已打开的自有的浏览器页面：`list_browser_targets`。
- Fiddler Everywhere 流量或原生 `.saz` 抓包：阅读
  [Fiddler 工作流](references/runtime-observation.md#fiddler-everywhere-traffic-debugging)。
  用 `inspect_web_network_capture` 和 `format: "saz"` 检查保存的 SAZ；
  实时流量需连接 Everywhere 独立的 MCP 服务器。
- 保留的 HAR/SAZ/原生 mitmproxy/aioquic qlog 抓包：`inspect_web_network_capture`。有用时选择原始记录序号；检查产生者字段和字节/数字 sidecar，不要去请求已记录的 URL，也不要声称实时归属。参见[历史抓包](https://github.com/hubooooooo/chaichai/blob/main/docs/web-network-captures.md)了解确切的上游配置和凭据排除规则。Qlog 支持从 aioquic 1.5.0 JSON 0.3 开始；流覆盖范围和端点丢包声明无法恢复报文正文，也不能证明网络丢包。优先使用 detail summary，再使用 kind qlog 的 trace/stream 页面；为 contribution/range 页面选择一个 trace、stream ID 和方向。事实（Facts）保留选择前所有已记录事件的视野。其他 qlog 布局和 PCAP 关联不受支持。
- 用户已打开的自有的 Electron 运行时：`list_electron_targets`。
- 已记录的数据包抓包：`inspect_packet_capture`，配合选定的 TShark 字段、
  display filter 和 decode-as 规则。需要 Linux、util-linux prlimit 和 `REA_TSHARK_COMMAND`；参见
  [抓包指南](https://github.com/hubooooooo/chaichai/blob/main/docs/packet-captures.md)。
  数据包限制在过滤前对输入包计数。输出默认 50 个匹配帧；后续页面使用 `match_offset` / `match_limit`，或用显式 null 限制获得完整的匹配输出。跨页面保留源摘要。本工具不进行实时抓包。
  地址/DNS/SNI/协议汇总使用 `inspect_pcap_capture`，先用 MCP detail summary，再使用保留的 kind pcap 页面。需要 Wireshark 4.x tshark
  和 capinfos，以及 Linux prlimit 或 Windows Job Objects；参见
  [数据包汇总](https://github.com/hubooooooo/chaichai/blob/main/docs/pcap-analysis.md)。
  地址页面选择精确的 DNS 查询；页面穷尽不证明网络完整性。本工具读取记录文件，不主动获取流量。
- 已记录的逻辑/信号 trace：`decode_signal_recording`，配合显式的 decoder、
  channel 和 protocol 设置。在带 util-linux prlimit 的 Linux 上，通过
  `REA_SIGROK_COMMAND` 提供 sigrok-cli 0.7.2；参见[记录指南](https://github.com/hubooooooo/chaichai/blob/main/docs/signal-recordings.md)。
  输出默认为 50 行字面文本；选择注解类别并用 `line_offset` / `line_limit` 分页，或用显式 null 获得所有剩余输出。
  窗口计数是显示行数，不是注解数或采样数。跨页面保留源摘要。本工具读取现有文件，不主动采集硬件信号。
- 显式的本地 WebAssembly 产物：`inspect_wasm_artifact`。通过 `REA_WABT_BIN_DIRECTORY` 提供 WABT 1.0.42；保留确切的字节/工具标识和解码后的 WAT。
  显式选择 JavaScript glue 和候选路径，保留 URL/路径的歧义。不隐式请求、不执行目标；WAT 不是原始源码。
  参见 [WASM 指南](https://github.com/hubooooooo/chaichai/blob/main/docs/wasm-artifacts.md)。
- 显式的本地 EVM 字节码载体：`inspect_evm_interface`，配合调用方选择的
  `raw` 或 `hex` 编码。保留载体/解码摘要，将 selector、参数字符串和可变性视为推断的候选；本工具不进行链上查询或目标执行。如需不含 hex 或重复 stdout 的完整推断接口，先发现支持情况再选择 `detail: "summary"`；完整
  Evidence 保留在其原始标识下。使用返回的
  `parent_evidence_id` 获取精确的函数或 `bytecode_hex`/stdout/stderr 页面。
  候选覆盖范围不证明接口完整。参见
  [EVM 字节码指南](https://github.com/hubooooooo/chaichai/blob/main/docs/evm-bytecode.md)。
- 内嵌的 Go 编译器、模块或构建设置元数据：`inspect_go_binary`
  加上显式的本地文件。这个内置的无目标检查不需要 Go 安装或反汇编器。保留原始模块字节和源码范围；
  元数据缺失不证明某二进制不是 Go，未解析的文本记录保持显式。参见
  [Go 二进制指南](https://github.com/hubooooooo/chaichai/blob/main/docs/go-binaries.md)。

- 显式的本地 SQLite 数据库快照：`inspect_sqlite_database`。使用 Node.js 24.x >=24.15 或 26+ 提供的原生 SQLite 限制来检查。先读 schema（默认紧凑清单），需要行数据时选择精确的普通表并配合
  `columns`。默认输出所选表的 schema 和 20 行；需要完整存储 schema 时请求 `schema_scope: "database"`。同时保留数据库和已有同目录 WAL 的标识；行样本
  报告截断且顺序不定。使用静默快照，不要假定活动数据库/WAL 对是被原子复制的。参见
  [SQLite 指南](https://github.com/hubooooooo/chaichai/blob/main/docs/sqlite-databases.md)。
- 显式的 Linux ELF 文件，用于离线布局、符号、重定位或静态缓解证据：`inspect_binary_layout`。这个无目标操作使用
  调用方提供的 pwntools，不打开反汇编数据库。保留其原始位置以及推断/覆盖范围限制；参见
  [离线二进制指南](https://github.com/hubooooooo/chaichai/blob/main/docs/binary-diagnostics.md)。
- 提供的 Linux x86-64 ELF core 文件：`inspect_recorded_crash`。在不打开活动目标的情况下读取每个已记录的
  线程、原始 note 和绑定源码的寄存器。历史 PID 不选择活动进程。仅当仅 core 的映射候选有帮助时才请求 `include_debugger_context`；参见
  [记录的崩溃指南](https://github.com/hubooooooo/chaichai/blob/main/docs/recorded-crashes.md)。
- PE 资源类型/名称/语言树和静态图标组引用：
  `inspect_pe_resources` 加上显式路径。这个可移植操作不需要
  活动目标或引擎；不透明负载保留文件范围和 SHA-256。
- 原生可执行文件、库或分析数据库：`open_binary`，然后
  直接使用聚焦的分析工具；当元数据或清单上下文有用且所选 provider 可用时调用 `binary_overview`。

对于已有的 IDA MCP 配置，使用 `open_binary` 加上原始
输入二进制和 `provider_id: "ida"`；不要传入 `.idb` 或 `.i64` 数据库。
旧的附加（attached）配置文件通过 SHA-256 绑定已打开 GUI 的输入，并保持其数据库打开。现代的 headless 配置文件创建并关闭一个
私有的自有数据库且不保存。安装和注册复用
[mrexodia/ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp)；参见
[IDA provider 指南](https://github.com/hubooooooo/chaichai/blob/main/docs/ida-provider.md)。
打开后直接进行 `analyze_function`、伪代码或函数/字符串搜索
；IDA 不提供 `binary_overview`。编排更广的工作流时查阅会话可用性。
现代直接调用方和不支持的档案（dossier）方面仍是未知的；实时 IDA 结果不会从快照回放。

如果用户只说"我的应用"而没有给出名称、路径或已选定的
目标，在搜索产物之前先问是哪个应用。无关的已保存报告中的路径和附近的测试夹具不选择用户的目标。尽可能把可读的真人可读应用名解析到一个明确的已安装产物；
匹配有歧义时提问。永远不要替用户选择示例应用。

在无目标会话中，使用 `open_binary` 绑定任何分析工具针对活动目标运行的归档/包或
原生目标。不要调用未公告的工具；用 `{}` 检查 `binary_session` 及其
`result.tool_availability` 获取不可用原因和修复方法。将每个
组的 `names` 展开为条目，继承清单级客户端要求，
除非该组覆盖了它们。在其封闭的 effect 和注解词汇表中，
列出的标志为 true，省略的已知标志为 false。分组的名称并集
是完整的工具清单；使用 `tools/list` 获取规范的工具 schema。
provider 候选事实描述可能的 provider，而顶层会话
能力描述当前路由，`analysis_provider_binding` 给出所选
provider。不要把这些范围视为可互换。

## 摘要优先的工作方式

从默认结果开始，使用其内联 Evidence 和图上下文。
对大小未知或较大的 JavaScript 应用或 ELF 布局，
用 `"detail": "summary"` 调用 `analyze_javascript_application` 或 `inspect_binary_layout`，然后用 `inspect_analysis_view` 检查保留的 `parent_evidence_id`。
对模块标识分页，请求单个条目前先选择返回的 `node_id`；单个文件路径可以代表多个图角色。不要在没有变更输入或解决阻塞的情况下重复相同的分析或被拒绝的调用。
生命周期变化使状态信息有用时，重新检查会话状态。
仅当返回的结果
留下某个具体问题未回答时，才进行聚焦的追问。

如果 MCP 报告 `resource_constraint` 且 `details.resource: "transport"`，用其报告的同一会话 Evidence 引用调用
`inspect_analysis_view` 获取摘要、单个章节/模块或一个稳定页面。已知 seed 后使用 `trace_application_feature`
一次，或调用 `export_evidence_bundle` 把完整
会话写入选定路径。分析在账本（ledger）中仍是完整的；不要仅仅为了请求同一个超大响应而重复分析。完整的 CLI JSON
输出也会流式传输，不依赖单个 MCP 帧。

当保留的父 ID 未知时，使用 `get_evidence_bundle` 配合
`detail: "summary"` 以及对 operation、目标 SHA-256、
分析配置摘要或规范过程地址的精确过滤。选择其返回的
Evidence ID 用于下一个视图，而不是请求完整 bundle。
`retention: "complete-record"` 表示整条记录已存储；原生
值流截断和未知元数据保持独立。对于导出的
可移植 bundle，使用 `chaichai inspect-evidence-bundle`，JSON 中包含 `path`、
`detail: "summary"` 和相同的 `filters`。读取该文件仍需
在本地内存预算内验证其全部内容。

客户端也可以在没有 ChaiChai 传输错误的情况下截断成功的工具结果。
将该预览视为不完整；需要完整记录时使用保留的父 ID 获取更小的
视图或导出。不要把预览当作规范 JSON 解析，也不要重复生产者。对 JavaScript，在深入大型图之前先阅读
[模块视图与追踪方法](references/javascript-applications.md)；宽泛的双向追踪即使在摘要分析之后也可能扩展无关的
包含关系。

每个结论必须区分观察、推断和未知。引用
Evidence ID，保留限制和不完整的覆盖范围，绝不要暗示
静态分析观察到了执行。运行时请求执行声明的
目标和生命周期；不要将这些字段之外扩大目标或动作。

在用户请求的调查范围内，直接调用可用的分析工具。
ChaiChai 不需要权限授予或逐次调用审批标志。
agent 客户端可以独立要求审批。遵循声明的请求
范围和主机的实际访问要求；对观察到的客户端策略拒绝使用恢复指南。

## 规划更大的调查

对跨多个功能或子系统的请求，使用分阶段工作流：

1. 把请求变成问题清单和每个答案所需的证据。在再次询问信息之前，从对话和工作区
   中确定目标标识和约束。
2. 检查当前 ChaiChai 会话、产物标识、已保存的分析数据库、
   书签和既有证据。复用匹配的状态；不要打开重复的
   会话或重复相同的分析。
3. 从最小的有用概览或清单开始。沿着每个问题从其入口点
   穿过相关数据和状态变化到达其结果。
   围绕一个具体假设批量执行相关操作，仅当返回的证据
   留下具体缺口时才扩大范围。
4. 当打包资源和配置影响问题时，连同代码一起检查它们。使用格式感知的清单和解析器；不要仅凭文件名、字符串或布局推断行为。
5. 用结论所需的证据类型来佐证它。仅当静态证据无法回答
   问题且所需的主机运行时和 OS 访问可用时，才使用运行时
   观察。对 JavaScript 行为，
   通过可用的浏览器、Electron 或进程抓包工作流对实际应用运行探针。
6. 把工作拆分为独立的问题。当并行 worker 可用且问题互不依赖时，分配独立的
   范围，指向既有证据，并要求它们返回来源、
   结论和未解决的缺口。否则按顺序工作。
7. 维护一个简洁的发现账本，把每个结论链接到 Evidence ID、
   置信度/证据类型、搜索边界和剩余未知。更新
   共享索引或调查报告，以便后续轮次可以复用结果。

结束前，回到原始清单。根据证据把每个问题标记为
已回答、部分回答或未解决；保持有限否定搜索的有限性，不要在必需的问题仍开放时
把宽泛的调查描述为已完成。

## 只读相关指南

- 原生二进制、托管程序集、归档和提取：
  [references/native-and-artifacts.md](references/native-and-artifacts.md)
- ASAR、已解包的 JavaScript、功能追踪和版本比较：
  [references/javascript-applications.md](references/javascript-applications.md)
- Android APK 声明、类、方法和静态引用：
  [references/android-applications.md](references/android-applications.md)
- 被动的浏览器/Electron 观察和静态/运行时对账：
  [references/runtime-observation.md](references/runtime-observation.md)
- Evidence 分页、比较、残余未知和验证：
  [references/evidence-workflows.md](references/evidence-workflows.md)

## 完成任务

用平实的语言解释发现，并把它们与返回的证据关联起来。当
用户要求构建某个东西时，使用常规编码工具，并把观察到的
行为与设计选择分开。调查完成后，用
`close_binary` 关闭已打开的原生会话。
