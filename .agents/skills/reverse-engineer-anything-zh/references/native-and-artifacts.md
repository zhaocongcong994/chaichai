# 原生、托管与打包产物

## Go 构建元数据

当问题涉及内嵌编译器版本、模块/依赖版本、本地替换（replace）或构建设置时，
对明确的本地 ELF、PE 或瘦 Mach-O 文件使用 `inspect_go_binary`。无需
`open_binary`、Go 安装环境或目标执行。对应的 CLI 等价命令是
`inspect-go-binary PATH`。保留产物的 SHA-256、原始文件区间、成帧的模块
字节以及每一条未解析的模块文本行。记录缺失是一种未知，而不是「非 Go
二进制」的证据；观察到的元数据并不能为其声明背书。函数、源码与类型的
恢复仍属于单独的原生分析问题。

## SQLite 快照

对明确的本地数据库快照使用 `inspect_sqlite_database`，可获取其模式
（schema）以及某一张精确指定的普通表的可选行。它要求 Node.js
24.x >=24.15 或 26+，且具备原生 `DatabaseSync.limits` API。它还会消耗
已有的同名 `-wal` 文件；引用其结果时，请同时保留两个原始摘要（digest）。
默认输出为紧凑清单；选定某张表时仅展开该表自身的模式并采样 20 行。
选择 `columns` 以避开无关或过大的单元格，仅在需要完整模式细节时才请求
`schema_scope: "database"`。在有用的有限采样场景下选择 `row_limit`，并
明确标注截断与未指定的行序。虚拟表、影子表和视图是模式事实，不是行读取
目标。ChaiChai 检查的是私有副本，不改动源文件；检查前请先获得一致的
静默（quiescent）数据库/WAL 快照。参见
[SQLite 快照](https://github.com/hubooooooo/chaichai/blob/main/docs/sqlite-databases.md)。

## 已记录的 Linux 崩溃

对明确的 Linux x86-64 ELF core 路径使用 `inspect_recorded_crash`，
以检查历史线程寄存器、信号、原始 notes 和原始文件区间。它与当前活动的
反汇编目标相互独立。绑定到源码的寄存器值和 note 字节属于观察结果；
缺失的 notes、信号-线程关联以及当前可执行文件/库的身份仍是未知。PID
是历史元数据，绝不授权实时附加（attach）或控制。

可选的 `include_debugger_context` 切面通过调用方提供的 GDB/pwndbg
在独占的仅 core 会话中补充映射候选。显示名不能确立当前文件身份；报告
的 flags 为零时权限仍属未知。请求不可用的上下文会以设置指引失败。精确的
上游配置、边界与验证覆盖范围参见
[已记录的崩溃](https://github.com/hubooooooo/chaichai/blob/main/docs/recorded-crashes.md)。

## 离线 ELF 布局

对明确的本地 ELF 路径使用 `inspect_binary_layout`，无需打开反汇编目标
即可获取文件支撑的节区（section）、符号、重定位、链接名称以及静态缓解
（mitigation）推断。当该完整记录已保留时，调用 `inspect_analysis_view`
获取摘要、缓解切面或链接切面、单个节区或符号，或某个稳定的分页。不要
为了读取单个对象而重新运行解码器。

## 离线 WASM

对选定的本地字节，配合调用方提供的 WABT 使用 `inspect_wasm_artifact`。
如需计数、校验和 WAT 恒等性，在第一次 MCP 调用时选择
`detail: "summary"`。完整的原始证据（Evidence）始终保持保留；需要精确的
导出项或文本分页时使用 `normalized_result.parent_evidence_id`。省略
detail 或使用完整 detail 时保持已有的完整结果。
对于已完成的结果，使用 `inspect_analysis_view` 及其报告的保留引用获取
摘要，或使用
`view: {kind: "wasm", facet: "exports", offset: 0, limit: 32}`。
其他切面还包括 sections、imports、candidates、glue、WAT、headers、
details 和工具画像。文本偏移量按 UTF-16 码元计数；请遵循 `next_offset`。
MCP 响应超大后完整源数据仍保持保留。这并不意味着目标执行或网络获取，
且 WAT 是解码表示。

## 原生目标

`open_binary` 之后，直接使用聚焦的搜索、过程（procedure）或函数工具。
当目标元数据或清单上下文有助于回答问题时，使用 `binary_overview`。
优先使用字面量搜索、名称、反编译、调用方、被调方和交叉引用。地址和
恢复出的伪代码是分析观察结果，不是原始源码。提供方不可用和不支持的
元数据仍是未知，而不是错误。

对于已完成的 `analyze_function` 档案（dossier），使用
`inspect_analysis_view` 并指定
`view: {kind: "native", facet: "value_flow_operations", offset: 0, limit: 32}`
以及精确的保留证据 ID，即可在不重新分析的情况下读取选定事实。
原生切面还包括 procedure、pseudocode、assembly、basic blocks、
comments、callers/callees、references、unresolved calls、referenced strings
和 names、原生 API 记录，以及 value-flow 摘要。伪代码的偏移量与限制按
UTF-16 码元计数；使用返回的 `next_offset` 进行续读。提供方限制和不可用
的事实保持显式标注；完整的父证据始终保留。

要一次性观察 Mach-O 实际调用了哪些函数或 Objective-C 方法，使用
`observe_native_calls`，并显式指定断点和有界的
`duration_ms`/`max_events`。它会在 LLDB 下启动一个新进程，因此目标会
运行，可能修改文件或使用网络。启用 hardened-runtime 的目标需要
`get-task-allow` 权限。

不带参数使用 `binary_session` 检查已打开的目标、选定的提供方和对齐
状态。其默认的 `result.tool_availability` 携带按共享事实分组的完整
清单。展开每组的 `names`，并继承清单级的客户端要求，除非某组覆盖了
它们；可用性、原因、修复建议、模式和标志保持内联。`effects` 和
`annotations` 数组命名来自固定词汇表的真实标志，因此被省略的已知标志
即为假。当目标或提供方状态变化时，`tools/list` 仍是完整工具模式
（schema）的权威来源。

提供方能力组携带提供方身份和有序限制。将每组集合的 `shared_limitations`
前置到该组的 `limitations`，即可恢复该操作的完整有序列表。候选能力
描述可能的提供方。顶层会话能力描述当前路由，
`analysis_provider_binding` 标识选定的提供方。

## 配合 Ghidra 分析 DOS MZ

对于已准入的 DOS MZ 目标，使用 `inspect_native_load_image` 检查实测的
加载字节、文件映射、重定位以及入口点是否与不可变快照一致。保持
`mismatch` 和 `unsupported` 显式标注。已验证的导入覆盖的是报告的静态
镜像，不包括运行时的 DOS 或 PC-98 硬件行为。

使用 `read_bytes` 读取已初始化的分析内存，使用 `address_to_file_offset`
将单个观察到的地址锚定到原始文件字节。加载器修正可能改变一个字；源码
偏移不意味着字节相等。完整函数体区间使用闭区间端点，且可能包含空洞。
不要把包围跨度当作代码。对于加壳目标，分别保留原始产物身份与派生产物
身份；对脱壳桩（stub）做反编译并不能恢复未加壳的程序。

读取 Objective-C 调度元数据时，区分类实现方法与协议要求：类方法报告
空的 requirement 标志，而解码出的协议声明保留 required 与 optional
事实。属性属性保持原始 name/value 标记形式；需要解码 `N` 标记或默认
atomic 行为时，使用属性的 `atomicity` 字段。空的类/meta 标志、ivar
计数、atomicity 或只读值意味着选定的提供方未确立该事实。仅凭符号名
不能证明某个类是根类或没有 ivar。

## 托管 PE/CLI

从 `inspect_managed_artifact` 开始。ChaiChai 的规范托管检查是无执行
的：不要声称其加载、反射、执行或解析了该程序集。保持托管/原生边界和
不可用的重建事实显式标注。自带（bring-your-own）重建预言机（oracle）
与规范解析器是分离的，绝不能成为隐式的安装依赖。

对于身份/分类问题，`inspect_managed_artifact` 可以在第一次 MCP 调用时
显式选择 `detail: "summary"`。它保留完整元数据，并返回带链接的总览，
包含完整分类/证据、可空的模块/MVID、框架、元数据覆盖/问题/限制以及
返回行数。默认的完整请求保持不变。使用 `inspect_analysis_view` 读取
原始行，指定 `normalized_result.parent_evidence_id` 来源，以及
`view: {kind: "managed", collection: "attributes", offset: 0, limit: 16}`。
集合（collection）包括 `references`、`resources` 和 `attributes`。分页
不会重复解析。返回行耗尽并不证明元数据完整或在部分/不可用覆盖下不
存在缺失；保留构建本地的标记（token）及其产物/MVID 作用域。

### .NET NativeAOT

NativeAOT 二进制包含原生机器码，因此普通的 CIL 反编译器无法恢复原始
方法体。当托管元数据/CIL 缺失时，将其归类为原生分析路由，而不是声称
源码恢复。用选定的深度提供方打开原生镜像并检查函数、字符串、调用和
引用；将反编译输出描述为伪代码与推断。

NativeAOT 镜像可以是 PE/COFF、ELF 或 Mach-O 可执行文件和共享库。使用
文件字节和加载器元数据而非后缀来识别它们。对于打包应用，使用
ChaiChai 的产物工具进行清单盘点/解包，并保留精确的包含镜像身份。
PDB、ELF debug 或 dSYM 伴生文件仅在提供方接受并匹配它们时才是补充
证据。

ChaiChai 内置了针对带 .NET 8 RTR 9.1 元数据的 x64 PE 目标的只读快照
解析器。可选的无头 Ghidra 适配器在 Linux 上增加数据库注释和更广的
元数据恢复；它需要一个显式配置的 NativeAOT JAR。这些是相互独立的路由。
安装、支持的布局和主机限制参见
[NativeAOT 指南](https://github.com/hubooooooo/chaichai/blob/main/docs/ghidra-nativeaot.md)。
保留二进制身份，区分派生元数据与 Ghidra 数据库观察结果。恢复出的类型
和原生伪代码不是原始 C# 源码。Windows Ghidra P0 没有数据库变更权限。

## 包与解包

对于应用包（bundle）、归档文件、ZIP/APK/IPA/MSIX/AppX、ASAR 或 DMG
输入，当产物图（artifact graph）和发现项有助于回答问题时，使用
`inspect_artifact`。它内联返回完整的产物图。使用图清单 ID 时加以引用。

对于 IPA 或 macOS `.app`、ZIP 或 DMG，将清单证据传递给
`project_apple_application_graph`。它按路径约定报告应用根和嵌套包：
app 扩展、XPC 服务、框架、登录项、系统与驱动扩展以及插件。它还列出
特权辅助程序（privileged helpers）、launchd plist、符号链接，以及每个
包的 `info_plist_path` 和可执行文件候选。角色来自路径约定，不是解析
出的 plist；用 `inspect_plist` 读取列出的 plist。

在 `.app` 或 Mach-O 上执行 `open_binary` 之后，使用
`trace_dylib_resolution` 查看包中每个可执行文件的每个 `@rpath`、
`@loader_path` 和 `@executable_path` 加载实际到达哪个文件。它还列出
缺失或弱加载以及早前缺席的 `@rpath` 候选。用 `roots` 或
`architecture` 收窄大型包。系统路径保持未确定，因为它们由 dyld 共享
缓存提供。

需要物化文件时使用 `extract_artifact`。它解包活动目标并接受可选的
`integrity_policy`；参见 [MCP 契约](https://github.com/hubooooooo/chaichai/blob/main/docs/mcp-contracts.md)。
它把所有常规文件物化到由 ChaiChai 选定的新临时目录中。符号链接和加密
条目是清单事实，不是可解包的文件。结果报告物化目录；调用方不能选择
目的地。无需单独授权。

原生 DMG 遍历在受支持的 macOS 主机上自动使用只读挂载，使用独占的
临时挂载目录并自动清理。无需批准标志。不受支持的主机或挂载失败保持为
显式限制；只有根身份可用时不要声称子级清单。解包是单独的文件系统
写操作。

对于无头的 DOS COM，显式以 `format: "dos-com"` 打开（CLI 为
`--target-format dos-com`）。在信任函数分析之前先检查加载镜像：入口为
`0x10100`、文件偏移为零，并施加了实模式段上下文。PSP/栈/设备状态
仍未建模。参见 [DOS 指南](https://github.com/hubooooooo/chaichai/blob/main/docs/ghidra-dos.md)。

对于其他无头镜像（没有 ELF/Mach-O/PE/MZ 头的嵌入式固件），以
`format: "raw-binary"`、`architecture`（`x86`、`x86_64`、`arm` 或
`arm64`）和 `entry_point`（`0x` 十六进制）打开。文件偏移 0 映射到该
地址。Hopper 和 IDA 拒绝这种解释；Ghidra 使用 `BinaryLoader` 搭配
小端通用语言。大端、仅 Thumb 和 Cortex-M 变体不受支持。参见
[裸二进制指南](https://github.com/hubooooooo/chaichai/blob/main/docs/raw-binary.md)。

### Ghidra 中的函数标注

使用 `annotate_native_function` 为单个函数命名和/或添加入口注释，
至少显式指定一处更改。内联检查其标注回读和刷新后的档案。更改是原子
且会话级的；空注释会清除注释，省略字段则保留原值。在关闭之前，后续
MCP 调用都能观察到编辑。CLI `annotate-native-function` 返回更新后的
分析结果，然后丢弃会话。原始可执行字节保持不变；编辑会使不可变快照
失效。Windows P0 不允许数据库变更。仅命名时，`set_address_name` /
`set_addresses_names` 也可配合 Ghidra 使用：它们为函数入口或数据
地址（主标签）命名，并返回紧凑的逐地址成功布尔值，而不是完整档案。

## 离线 PE 资源清单

对绝对 `path` 使用 `inspect_pe_resources`，或运行
`chaichai inspect-pe-resources ./selected.exe --json`，在不开
启原生目标的情况下进行可移植的 PE32/PE32+ 资源检查。保留返回的证据：
type/name/language ID 和 UTF-16 名称、原始目录/数据/载荷区间、代码页、
载荷哈希和静态图标组引用。同语言图标解析是显式的；缺失的引用和尺寸
不匹配保持可见。其他载荷是不透明的，本操作不解码图像，也不模拟
Windows 资源加载。预算和支持的树形配置参见
[离线二进制诊断](https://github.com/hubooooooo/chaichai/blob/main/docs/binary-diagnostics.md)。
