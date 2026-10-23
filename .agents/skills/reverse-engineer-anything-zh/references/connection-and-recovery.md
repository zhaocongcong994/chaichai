# 连接与任务恢复

仅当遇到已观察到的连接、命令、审批或 provider 阻塞时，才阅读本指南。始终
关注用户的目标和问题。说明是什么阻止了该操作以及下一个有用的步骤；修复后，
继续原调查。

下文命令假定已安装 `chaichai`。若不可用，在获得授权获取 ChaiChai 时，
改用 `SKILL.md` 中的包调用方式。遵循已连接服务器的 schema 和已安装 CLI
的 help 输出，不要假设仓库 main 分支与旧版本暴露相同的参数。

## 根据观察到的失败选择补救措施

| 观察到的现象                                                    | 含义与下一步                                                                                                                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 当前会话中没有 ChaiChai 工具                                    | 用 `chaichai doctor --client codex --json` 检查注册情况。仅安装技能本身不会注册 MCP。                                                                                                                                |
| 注册缺失、格式错误或已过期                                      | 制定限定范围的安装计划；仅执行已授权的更改，并保留备份。                                                                                                                                                             |
| 注册对齐，但没有连接的工具                                      | 重启/重新连接客户端。doctor 只检查注册情况，无法建立当前 agent 的连接。若重连失败，检查客户端的启动错误。                                                                                                            |
| `MCP tool call requires approval, but approval policy is never` | Codex 在 ChaiChai 执行之前拒绝了该调用。不要通过安装引擎或重复安装来解决这个客户端策略决策。见下文审批部分。                                                                                                         |
| ChaiChai 返回 `provider_unavailable` 或不可用的工具条目         | 读取该操作的 provider 诊断或 `binary_session.result.tool_availability`。展开各组的工具名，除被覆盖外沿用共享的客户端要求。使用该操作的 availability、reason 和 remediation；完整的工具目录并不意味着每个操作都可用。 |
| 子 shell 中缺少 `chaichai`，或 Node 版本不兼容                  | 检查实际的 shell PATH 和启动器/运行时。prefix 安装可能不在登录 shell 的 PATH 中；这并不能证明 MCP 注册已损坏。                                                                                                       |

如果客户端无法启动其 shell/沙箱辅助程序或读取已安装的技能，检查其启动
诊断。例如，当 CODEX_HOME 位于 `/tmp` 下时，Codex 可能拒绝辅助别名；
此时使用位于操作系统临时目录之外的已授权 profile。ChaiChai 的安装无法
修复客户端的执行器。不要为了让某个分析命令工作而暗中禁用沙箱，应保留
沙箱。

静态 JavaScript 分析和普通 ZIP 清点既不需要 Hopper 也不需要 Ghidra。
HAR 检查是离线的，不需要活动的浏览器。原生反编译、Android 分析和固件
提取各有自带的先决条件。当受支持的清点/静态证据能回答问题的部分时，
就使用它，并单独说明不可用的证据。不要替换为另一个目标。把来自普通
shell 工具的观察明确标注为如此；只有真实的 ChaiChai 输出才构成
ChaiChai 证据。

## 需要时修复注册

对于 Codex：

```bash
chaichai doctor --client codex --json
chaichai setup --client codex --dry-run --json
```

使用当前受支持的客户端 ID：`claude_code`、`claude_desktop`、`codex`、
`cursor`、`gemini_cli`、`windsurf`、`devin`、`opencode`、`antigravity`、
`copilot_cli`、`commandcode`、`qwen_code`、`vscode`、`trae`、`grok_build`、
`omp`、`pi`、`hermes`、`qoder`、`zcode`、`dsh` 或 `grok_bot`。若未知，
先检查 `doctor --json` 再选择范围。`grok_bot` 使用聊天注册步骤，而不是
本地 `mcp.json`。对于不受支持的客户端，使用锁定版本的手动 stdio 注册
或 CLI。

展示计划中确切的路径、备份、更改和捆绑技能的替换内容。当该具体范围
尚未获得授权时，写入前先取得批准，然后用
`chaichai setup --client codex --yes` 应用相同范围。仅在单独需要且明确
批准时才添加 `--install-hopper`。不要安装或升级无关的先决条件。
重启/重新连接，验证工具确实出现，然后继续原任务。如果工具仍然缺失，
检查启动失败的原因，而不是反复执行安装。

## Codex 工具审批与 ChaiChai 就绪状态是两回事

ChaiChai 工具没有权限授予握手。Codex 仍可能因为某操作会创建自有资源、
启动辅助程序或有清理副作用而要求审批。已公布的工具或成功的 doctor
结果都不能覆盖该客户端策略。仅 `workspace-write` 无法解决 MCP 审批
拒绝，而 `approval_policy = "never"` 也不意味着每个 MCP 工具都已预批准。

当交互式审批可用时，使用客户端的审批流程处理所请求的操作。在无人值守
运行中，如果执行环境允许，可继续执行已授权的 CLI 工作流；否则报告被
阻塞的操作以及继续所需的审批。不要重试同一个被拒绝的调用，不要暗中
扩大审批范围，也不要把 MCP 副作用改写为只读来规避。

对于明确希望在一次性 Codex profile 中预批准指定操作的操作员，当前
Codex 支持按工具配置。例如，打开和关闭分析会话可以独立设置范围：

```toml
[mcp_servers.chaichai.tools.open_binary]
approval_mode = "approve"

[mcp_servers.chaichai.tools.close_binary]
approval_mode = "approve"
```

使用实际的服务器 ID，并且只包含已批准其副作用的操作；本例并不批准
检查、提取或运行时执行。展示提议的配置编辑，写入前保留无关条目和
备份。托管策略可能约束客户端设置。查阅
[Codex 配置参考](https://learn.chatgpt.com/docs/config-file/config-reference)
了解已安装客户端支持的设置。这是一个可选的恢复选择，不是每个 ChaiChai
任务的先决条件。

## 通过已安装的 CLI 继续

仅在启动器失败时检查命令环境：

```bash
command -v chaichai
command -v node
node --version
chaichai --version
```

当子 shell 丢失 prefix 安装时，使用位于已知安装路径的公共启动器，并
配合 PATH 上受支持的现有 Node。避免使用内部的 `dist/cli.js` 入口点
或全局工具链更改。即使某个 shell 无法解析 `chaichai`，MCP 也可能有
自己有效的启动器。

对于用户提供的 JavaScript 目录树或 ASAR，在已授权的工作区中选择输出
文件，并在读取视图之前保存完整的证据：

```bash
chaichai analyze-javascript-application /absolute/path/to/app --json > app-evidence.json
jq -c '{source: {kind: "inline", evidence: .}, view: {kind: "summary"}}' app-evidence.json > app-view.json
chaichai inspect-analysis-view app-view.json
```

这些命令不会注册 MCP，也不会安装分析引擎。CLI 的 JavaScript JSON 是
完整的，可能非常大；应重定向输出，而不是把它加载进上下文。如果没有
`jq`，使用现有的 JSON 处理工具，不要仅为这个配方安装一个。使用相同的
内联来源和 [JavaScript 配方](javascript-applications.md) 检查模块页面
或条目。保留图覆盖率、限制和未知项。原生 CLI 分析仍需要其选定的引擎，
所有 CLI 操作都保留主机的执行权限。
