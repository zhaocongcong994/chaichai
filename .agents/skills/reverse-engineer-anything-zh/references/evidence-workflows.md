# 证据、比较与验证工作流

产出证据的工具会直接在 MCP `structuredContent` 和 CLI JSON 中返回完整的证据记录。操作数据读取 `normalized_result`；当其他工具或你的说明需要稳定引用时，引用 `evidence_id`。保留来源权威性（authority）、局限性（limitations）、覆盖范围（coverage）和残余未知项。如果结果不完整或分页，仅当剩余数据对任务有实际意义时才继续获取；不要仅为读取已内联返回的结果而获取包或资源。当已保留完整的 `inspect_binary_layout` 或 `analyze_javascript_application` 证据时，改用 `inspect_analysis_view` 获取摘要、单个 section/symbol/module 或稳定页面，而不要重复调用产出工具。

已完成的 `inspect_artifact` 清单同样支持摘要视图和 `view: {kind: "inventory", collection: "occurrences", logical_paths: ["package.json", "main.js"]}`。省略 `logical_paths` 可分页读取全部出现的条目；`[]` 表示不选择任何条目。其他清单集合为 `nodes`、`edges` 和 `integrity_contradictions`。将 `source_complete` 与分页耗尽区分开：部分来源证据中缺少匹配项并不能确立其不存在。当来源必须在会话结束后仍存在时，在关闭会话前使用返回的父证据 ID 进行后续视图和导出操作。
当 `tools/list` 宣告 `inspect_artifact.detail` 时，请求 `"summary"` 以保留其完整来源并立即获得该视图。没有该宣告选项时，保留现有的完整调用。CLI 检查返回可移植的完整证据；在投影选定的内联视图之前先保存它。

使用 `record_unknown` 跟踪用户调查中未解决的问题，并注明仍需的来源权威性（authority）或环境。提供支持性和矛盾性的证据 ID。它会直接更新会话注册表。
使用 `update_unknown` 时带上当前修订版本号；遇到过期修订版本号时先重新读取，不要盲目重试。只有符合条件的已观察证据才能验证一项解决结论。

在断言等价性或缺失时，使用带有完整、兼容页面集合的比较：

- `compare_artifacts` 按出现路径、内容、元数据和图关系比较清单页面。
- `compare_functions` 比较显式的函数证据，而不是模糊的整体二进制匹配。
- `compare_bundles` 比较规范包成员关系和未知历史。
- `find_changed_behavior` 组合已有的比较；静态差异仍是候选线索，而非因果证明。
- `build_call_path` 需要来自同一 artifact/provider 的显式函数档案；不完整的前沿（frontier）会使缺失结论变为未知。
- `correlate_static_and_runtime` 使用显式映射；匹配模式是假设，而非因果关系。
- `verify_reconstruction` 评估一个有限的类型化规范。通过仅覆盖已声明的可比较断言，不代表全局等价。

进程捕获是选择加入的行为证据，不是安全沙箱。V3 捕获无法升级到 V4；重新运行原始场景。区分根进程退出与子进程落定，并在任务需要时要求新鲜度。
一个超时但必须写出最终报告的目标需要 `finalization_ms`：ChaiChai 向被捕获的根进程发送 SIGTERM，继续观察，并仅在目标在该时间间隔结束时仍未退出的情况下发送一次 SIGKILL。
`exit.finalization.signals` 列出每次尝试及其投递结果；观察到的退出信号保留在 `exit.signal` 中，每个限时退出（deadline exit）的 `exit.code` 均为 null，自行退出的终结器（finalizer）的退出码在 `exit.finalization.exit_code` 中（信号退出或未观察到退出时为 null）。

对已保留的 `inspect_web_network_capture` HAR 证据，使用带 `view: {kind: "api-surface"}` 的 `inspect_analysis_view`，按方法、origin 和路径模板对观察到的请求行分组。格式匹配是推断，不是处理程序身份（handler identity）或 schema。分组页面引用父记录序号；在断言完整性之前查阅记录覆盖范围和排除项。不会重放任何请求。
