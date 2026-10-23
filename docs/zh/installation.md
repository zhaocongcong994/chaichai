# 安装与设置

运行 ChaiChai，接入你选择的 Agent，并检查当前任务所需的工具。
安装过程会先预览配置变更，并在应用之前请求批准。

| 任务                 | 对应章节                                                            |
| -------------------- | ------------------------------------------------------------------- |
| 接入一个 Agent       | [开始设置](#start-setup)，然后[检查变更](#review-setup-changes)     |
| 诊断单个任务         | [定向就绪检查](#check-readiness-for-your-task)                      |
| 配置分析引擎         | [Hopper](#hopper)、[Ghidra](#ghidra) 或 [IDA 指南](ida-provider.md) |
| 更新或移除 ChaiChai  | [维护](#diagnose-update-and-remove)                                 |
| 解决特定客户端的问题 | [客户端配置](client-configuration.md)                               |

## 开始设置

```bash
npx chaichai-ai setup
```

选择要配置的 Agent，检查建议的路径和变更，然后批准该计划。
npm 的软件包下载批准和 ChaiChai 的安装批准是相互独立的。安装程序在修改 Agent
配置或安装 Hopper 之前都会先询问。安装完成后，请重启完成信息中列出的 Agent。

如需使用最新发布的版本，请使用 `npx chaichai-ai@latest setup`。
[软件包运行器与全局安装](#package-runners-and-global-installation)一节
介绍了显式版本、Bun、运行时要求和 curl 包装脚本。

## 检查设置变更

`chaichai setup` 首先会以多选形式列出支持的 Agent。已有的 ChaiChai
注册项默认被选中。新检测到的客户端保持可选但未选中：检测只为安装提供上下文，
并不代表获准添加新的注册。未检测到配置的客户端仍然可以被选中。
显式使用 `--client` 标志会跳过这个问题。

安装程序会为选中的客户端添加 MCP 访问。默认情况下，它会连同这些集成一起安装
ChaiChai 捆绑的工作流；使用 `--skill=false` 可跳过。如果没有选中任何 Agent，
安装程序会单独询问是否为 CLI 使用安装该工作流，默认选项为否。Hopper 是一个
单独的可选项目：安装程序会显示它建议的安装或连接方案，并需要单独明确批准。
它也可以为已有的 Ghidra 安装保存已验证的路径。

选择之后，请在 ChaiChai 写入文件或安装 Hopper 之前，检查计划中的确切路径和变更
并予以批准。你可以在任何提示处取消。

在应用变更之前，ChaiChai 会检查你当前的配置。计划会列出：

- 已有的 Hopper 安装、已验证的已有 Ghidra 安装，或它建议安装的官方 Hopper 软件包；
- 每个检测到的 Agent 配置路径；
- 每个选中的 ChaiChai skill 目标位置；
- 外部软件、网络来源、完整性证据以及软件包管理器命令。

格式错误或有害的已有配置会在安装 Hopper 或写入任何文件之前阻止整个事务。
拒绝或按 Ctrl-C 不会产生任何变更。Agent 配置写入会保留无关的条目和注释、
创建备份、使用原子替换并验证结果。安装和卸载都会保留已有的 `.chaichai.backup`，
而不会替换第一个快照。
安装还会保留 ChaiChai 已有服务器条目中的有效环境覆盖项，
例如 `REA_MCP_INPUT_SCHEMA_PROFILE` 和 `REA_MCP_MAX_RESPONSE_BYTES`。
检测到的提供方设置只替换匹配的环境键。
在安装写入文件之前，安装和 doctor 会报告格式错误的 ChaiChai 环境映射
或无效的运行时设置。请在客户端配置中修复被指出的设置；
安装程序不会静默丢弃映射中的其余内容。

安装完成后，ChaiChai 会报告哪些 Agent、分析工具和工作流文件通过了最终检查。
请重启完成信息中列出的 Agent，然后开始你的分析。失败的步骤和诊断信息
会保留在终端历史记录中。

在脚本中可以用可重复的 `--client` 标志选择确切的客户端。每个显式指定的客户端
都会跳过交互式选择。只有当你打算配置所有检测到的受支持客户端时，
才使用 `--all-detected`。`--skill=false` 会省略工作流，`--dry-run`
会返回一份只读计划，状态为 `planned`，退出码为 0：

```bash
chaichai setup --client codex --client cursor --skill=false --dry-run
```

提示界面和进度信息写入 stderr，以便 stdout 仍可用于结构化结果和管道。
`NO_COLOR=1` 可禁用颜色。使用 `--accessible` 可获得按顺序纵向呈现的
是/否提示。隐式交互式安装要求 stdin、stdout 和 stderr 均为终端；
当任意一个流被重定向时，安装会保持非交互模式。拒绝或取消会返回
状态 `cancelled`，退出码为 0。

用于自动化时，`chaichai setup --json` 会报告计划和一个精简的 `.doctor`
就绪预测，而不会应用计划。使用 `chaichai doctor --json` 获取完整的健康诊断
和规范的工具目录详情。请将 `--yes` 与明确的作用域（如 `--client codex`）配对使用；
当确需大范围作用域时使用 `--all-detected`。如果没有作用域标志，`--yes` 仅限
于已有的 ChaiChai 自有注册；它不会选中所有检测到的客户端。未经批准的实际应用
会报告 `needs_confirmation` 并以 1 退出。非交互地安装缺失的 Hopper 还需要
`--install-hopper`：

```bash
chaichai setup --yes --all-detected --install-hopper --json
```

### Skill 目标位置

捆绑的 skill 会安装到每个所选客户端的个人 skill 目录中。
各客户端特有的根目录、profile 和环境覆盖项请参见
[客户端配置](client-configuration.md)。混合选择会为每个不同的目标位置
分别制定计划。在没有选择客户端的情况下单独安装 skill 时使用 `~/.agents/skills`。
安装程序不会动其他位置已有的 skill 副本。

`chaichai setup --skill-client claude_code --yes --json` 会独立于 MCP 注册选择，
刷新并验证所选的 skill 目标位置。最终的 `doctor.scope.skill_clients`
记录了检查了哪些 skill 目标位置；`doctor.scope.clients` 继续描述所需的注册。
未选中的共享 skill 不影响仅针对客户端的刷新。

`doctor --skill --json` 会根据捆绑的说明和参考资料验证已安装的副本。
使用者应使用 `identity.skill.state`、`installed_version` 和
`installed_tool_count` 来判断 skill 就绪情况。已过时的
`installed_catalog_digest` 字段已被移除；当前的目录标识仍在
`identity.catalog` 中提供。

安装程序会把软件包运行器的 MCP 注册固定到精确安装的 ChaiChai 版本，
在同一计划中安装匹配的 skill 和按需参考资料，
并为 Codex 和 Grok Build 添加 `startup_timeout_sec = 30`。

## 检查任务的就绪情况

需要诊断时运行 `chaichai doctor`。它读取主机前置条件和 Agent 配置，
但不会修改它们。不带选项运行时，它会审计所有检测到的注册、
已安装的 skill 和可选的分析引擎；即使你选用的工作流可以正常工作，
其总体 `healthy` 值也可能为 false。

选择你要检查的部分：

| 任务                          | 就绪检查                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| 静态 JavaScript/Electron 分析 | 直接运行 `chaichai analyze-javascript-application PATH --json`。                       |
| 单个分析引擎                  | `chaichai doctor --provider ghidra --json`（或 `hopper`、`ida`）                       |
| 单个 Agent 注册               | `chaichai doctor --client codex --json`（客户端 ID 见[支持 Agent](#supported-agents)） |
| 已安装的工作流说明            | `chaichai doctor --skill --json`                                                       |

带作用域的报告具有 `scope.mode: "explicit"`。其 `scope_checks` 决定
`healthy` 和退出状态。其他检查出现在 `informational_checks` 中；
`environment_healthy` 汇总整个审计结果。`--target` 会添加一项目标检查，
但除非同时提供作用域选项，报告仍覆盖整个审计范围。

请按照失败检查的修复建议操作。如果一个原生目标有多个可用的提供方，
请在 CLI 上使用 `--provider`，或在 `open_binary` 上使用 `provider_id` 选择一个。
`capability_unavailable` 失败会携带 `details.selection_reason`：
`ambiguous` 要求你从 `details.candidate_ids` 中选择，
而 `provider_unavailable` 要求你修复所选引擎。参见
[提供方选择](cli.md#choose-a-provider)。

## 诊断、更新与移除

`chaichai doctor --json` 严格只读。`chaichai update` 只更新拥有当前运行 CLI
的 npm 或 Bun 全局安装。源码检出和软件包运行器副本必须通过拥有它们的机制来更新；
新的软件包运行器调用可以使用 `npx chaichai-ai@latest` 或 `bunx chaichai-ai@latest`。
`chaichai uninstall` 只移除 ChaiChai 自有的 Agent 注册和 skill 文件；
`--purge-data` 还会移除 ChaiChai 的缓存和状态路径。

```bash
chaichai update
chaichai uninstall
chaichai uninstall --purge-data
```

卸载会保留 Hopper、Node.js、Evidence 文件、捕获、无关的 skill 和其他 MCP 服务器。
清除数据只会移除 `~/.rea` 下 ChaiChai 的缓存和状态。如果某个客户端配置格式错误、
不可读或位于不安全的路径，操作会在移除任何内容之前停止；
某个客户端在更新过程中失败也会中止剩余的移除操作。作为符号链接的清除路径会被
保留并报告，而不是跟随。卸载会检查 ChaiChai 管理的共享位置和 Claude Code 个人
skill 位置。退出状态参见 [CLI 指南](cli.md#output-and-exit-status)。

### 更新拥有该安装的安装方式

`chaichai update` 会将精确解析出的版本安装到拥有当前运行软件包的
npm 前缀或 Bun 全局目录中，然后在报告成功之前检查新可执行文件的版本。
它不会重新打开引导流程。对于 npm 安装，版本查询和安装都使用 npm 配置的
registry。Bun 全局更新需要 Bun 1.2.17 或更高版本，该版本引入了 `bun info`。
更新器会先检查 `bun --version`，如果版本较旧或无法解析，会停止并提示
手动升级 Bun；它不会自行升级 Bun。
对于受支持的 Bun 全局安装，`bun info` 和 `bun add --global --ignore-scripts`
会使用 Bun 配置的 registry，并在拥有该安装的 Bun 全局目录中运行
（`BUN_INSTALL_GLOBAL_DIR`，否则为 `$BUN_INSTALL/install/global`，
否则为 `$XDG_CACHE_HOME/.bun/install/global`，否则为 `~/.bun/install/global`），
绝不会在调用者当前的项目中运行。缺少自身 `package.json` 的 Bun 全局目录
不会被当作自有安装，因为 Bun 会改为安装到最近的祖先项目中。
其维护计划只选择已有的 ChaiChai 注册和已安装的 ChaiChai skill。
运行返回的带作用域的安装命令以检查和批准这些变更，然后重启受影响的 Agent。
该计划会在终端、非 TTY 和 JSON 模式下返回，而不应用配置变更。

## 发布软件包与 main 分支

仓库的 main 分支记录的是其当前代码和生成的目录。`@latest` 选择的是
npm 发布版本，持久化的 MCP 注册固定到执行安装时的版本。
安装更新的说明不会更新正在运行的服务器或其注册。

main 分支的目录描述的是当前代码。要获得较新的功能，需要包含此检查点之后
更改的源码构建或后续发布。仅启动软件包并不能验证提供方的真实平台工作流。

要查看已发布的版本，运行 `npm view chaichai-ai dist-tags.latest`。
功能选择请使用已连接服务器的实际工具列表和公布的输入 schema。
开发检出中相同的软件包版本字符串并不能证明其字节与 npm tarball 一致。
通过经过审查的、带作用域的安装计划更新注册，然后重启/重新连接 Agent。

## 仅安装 Skill

```bash
npx -y chaichai-ai@latest setup --skill
```

只选择 skill 会安装 Agent 说明和捆绑的参考资料，而不是 ChaiChai MCP
注册或分析引擎。请按照 skill 的
[按需连接指南](https://github.com/hubooooooo/chaichai/blob/main/.agents/skills/reverse-engineer-anything/SKILL.md#connect-only-when-needed) 操作。
工具可用时可以立即使用。如果缺少工具，用 `doctor --client codex --json`
检查当前客户端的注册（替换为其客户端 ID），然后用
`setup --client codex --dry-run --json` 规划修复。在应用该作用域之前，
展示并批准确切的变更。注册一致但活动会话中缺少工具时，需要重启/重新连接；
`doctor` 检查的是文件和前置条件，而不是实时的 Agent 连接。

引导式安装默认安装软件包匹配的 skill；请遵循实际的服务器 schema 和
上文提到的发布边界。MCP 不可用时仍可进行静态 JavaScript CLI 检查：

```bash
npx -y chaichai-ai@latest analyze-javascript-application /absolute/path/to/app --json
```

它会直接返回完整的 Evidence 记录，且不需要任何原生引擎。
doctor 中的提供方故障不会妨碍其他与目标无关的工具。若要检查单个任务的
就绪情况而不是审计所有集成，参见
[检查任务的就绪情况](#check-readiness-for-your-task)。

## 支持的 Agent

安装程序可以为这些客户端配置 ChaiChai 的本地 MCP 服务器。Grok Bot 使用需要
手动配置的托管连接器；参见[它的配置](client-configuration.md#other-client-settings)。

| 客户端             | `--client` 值    |
| ------------------ | ---------------- |
| Claude Code        | `claude_code`    |
| Claude Desktop     | `claude_desktop` |
| Codex              | `codex`          |
| Cursor             | `cursor`         |
| Gemini CLI         | `gemini_cli`     |
| Windsurf           | `windsurf`       |
| Devin              | `devin`          |
| OpenCode           | `opencode`       |
| Antigravity        | `antigravity`    |
| GitHub Copilot CLI | `copilot_cli`    |
| Command Code       | `commandcode`    |
| Qwen Code          | `qwen_code`      |
| VS Code            | `vscode`         |
| Grok Build         | `grok_build`     |
| OMP                | `omp`            |
| Pi                 | `pi`             |
| Hermes             | `hermes`         |
| Qoder              | `qoder`          |
| Trae               | `trae`           |
| ZCode              | `zcode`          |
| DeepSeek Harness   | `dsh`            |

配置路径、profile、信任策略和 schema 限制变通方法参见
[客户端配置与故障排除](client-configuration.md)。

### DeepSeek Harness

参见 [Cordis 补丁和启动器设置](client-configuration.md#deepseek-harness)。

### 其他客户端设置

参见 [OpenCode、Grok Build 和 Grok Bot 设置](client-configuration.md#other-client-settings)。

## Hopper

Hopper 是独立的商业软件，有自己的许可证。它的免费演示版有厂商定义的
限制，付费许可证是可选的。ChaiChai 会复用检测到的任何安装，
并在卸载时保留 Hopper。

受支持的原生主机基线是 macOS 12+、Ubuntu 24.04+、Fedora 41+、
Nobara 44+、64 位 Arch Linux、CachyOS 或 Omarchy。Ghidra 和 IDA 有各自的
提供方专属主机要求；Windows Ghidra 使用[实验性的 P0 边界](windows-ghidra-p0.md)。

在 macOS 上，经批准的安装会下载官方 DMG，核对其公布的尺寸和摘要值，
验证应用包，并将其原子地安装到 `~/Applications/Hopper Disassembler.app`。
随后 ChaiChai 会打开 Hopper，让操作者选择演示模式或激活已有许可证。
不会使用 Homebrew，也不需要管理员权限。

ChaiChai 使用的 Hopper 启动器动作会从可执行文件创建文档；
其支持的命令行接口不能附加到已打开的文档。当另一个活动的 ChaiChai 会话
拥有同一目标和加载器 profile 时，第二个会话会报告拥有者的运行 ID，
而不是打开重复的文档。在 macOS 上，关闭拥有者的 ChaiChai 会话会解除这个保护；
Hopper 会保持其文档打开。因此稍后的 ChaiChai 会话可以为同一目标打开另一个
文档。ChaiChai 目前不会识别、聚焦或复用那个已有的 GUI 文档，
受支持的启动器也没有为它提供附加或复用动作。

在受支持的 Linux 发行版上，经批准的安装会先验证 Hopper 的官方
`.deb`、`.rpm` 或 Arch 软件包，然后再调用原生软件包管理器。
ChaiChai 在私有的 Xvfb 显示上运行受支持的演示版构建，并为每个分析会话
选择 Hopper 提供的演示模式；它不需要用户的桌面显示。无人值守的
软件包管理器访问需要 `--yes --install-hopper`。如果主机把 `/tmp/.X11-unix`
暴露为不可变挂载，ChaiChai 会先验证冲突，然后仅针对该目录使用无特权用户和
挂载命名空间以及私有 mode-1777 tmpfs。主机挂载和 `/tmp` 的其余部分保持不变；
此回退路径永远不会调用 `sudo`。`chaichai doctor --provider hopper --json`
会报告所选策略以及主机和生效的挂载事实。

受支持的 Linux 演示版会把额外的启动转发到其已有的应用中，即使跨私有显示。
因此 ChaiChai 会在协作的 ChaiChai 进程之间为每个用户保留一个 Linux Hopper 应用。
无论目标相同还是不同，竞争的 CLI 或 MCP 会话会在 Hopper 启动之前收到拥有者的
会话 ID。请通过那个 MCP 会话切换目标，或者在启动另一个会话之前将其关闭。
关闭拥有者会释放预约，并停止 ChaiChai 拥有的演示应用和私有显示；
无头 Linux 演示版在 MCP 关闭后不会保留文档。
其辅助进程会监视一条私有的生命周期管道，因此即使拥有者崩溃或被 SIGKILL，
也会停止这些子进程，而不依赖可复用的 PID 或进程名扫描。
后续会话会在子进程清理后回收已死亡拥有者的过期租约；
如果 ChaiChai 本身被杀死，私有运行时文件可能残留。这不会附加到或
声明对手动打开的 Hopper 应用的所有权。由旧版本 ChaiChai 遗留的仍在运行的
应用，在开始新会话前仍必须先关闭。

过期租约的回收是串行化的。如果中断的回收留下了它的预约目录，
诊断信息会指出该确切路径。请先停止 ChaiChai 会话，再删除该回收目录并重试。

### 启动器路径与故障排除

在 macOS 上，ChaiChai 默认使用
`/Applications/Hopper Disassembler.app/Contents/MacOS/hopper`。
在 Linux 上，它优先使用可执行的 `/opt/hopper/bin/Hopper`，
然后是可执行的 `~/.local/share/rea/hopper/bin/Hopper`；
如果两者都不存在，则以前者作为诊断回退。`HOPPER_LAUNCHER_PATH`
可以覆盖这些选择：

```bash
export HOPPER_LAUNCHER_PATH=/absolute/path/to/Hopper
chaichai doctor --provider hopper --json
```

Hopper 启动为启动、初始分析和已认证的桥接就绪预留 120,000 毫秒。
对于大型目标，请在启动 ChaiChai 的环境中把 `REA_HOPPER_STARTUP_TIMEOUT_MS`
设为 1 到 2,147,483,647 毫秒之间的十进制整数。CLI 和 MCP 使用相同的设置；
无效值会导致配置验证失败。MCP 客户端自身的请求超时也必须留有足够时间。

如果 macOS 拒绝了 Apple 事件，请在**系统设置 → 隐私与安全性 → 自动化**下
允许启动 ChaiChai 的应用，然后重试。当原生辅助进程报告了完整的授权拒绝、
且其参数无法改变辅助进程生成的 AppleScript 时，ChaiChai 会释放目标预约。
包含引号、反斜杠或换行的参数保持不变，但无法证明一次失败的交接没有打开文档。
其他失败的交接会保留所有权，直到确认文档关闭为止。如果超时的桥接稍后
就绪，`close_binary` 会连接到该运行、验证其身份并请求关闭文档。
连接断开后，桥接允许 30 秒进行带身份验证的清理重连，然后释放 Hopper 的
Python 执行线程。超时并不能证明文档已关闭，所以 ChaiChai 会保留未确认的所有权。
请在桥接仍可用时重试关闭。

如果 Linux 启动器存在但无法启动，请检查其共享库：

```bash
ldd /absolute/path/to/Hopper | grep 'not found'
```

安装缺失的软件包并重新运行定向检查。Linux 演示会话需要 Xvfb、Python 3、
X11 和 XTEST；经批准的安装会在受支持的发行版上安装这些依赖。
如有需要，请把 curl 安装程序报告的可执行文件目录（通常是 `~/.local/bin`）
加入 shell 的 `PATH`。

ChaiChai 会在需要时启动 Hopper。在 macOS 上，请在第一次 CLI/MCP 操作或
无人值守任务之前，在同一用户会话中完成其演示或许可证提示。如有需要可手动
打开 Hopper；其启动器也可以把该对话框带到前台。
如果启动报告 `Cannot launch Hopper! Connection is invalid.` 或一直等待桥接就绪，
请检查 Hopper 是否有待处理的演示、许可证或加载器对话框。完成对话框后重试。
如果 ChaiChai 报告 `cleanup_incomplete`，请在重新打开目标之前先按照下文的
保留资源指引操作。
Hopper 会串行化分析请求。取消等待可能让提供方的工作继续运行，会话会报告这一点。
成功的反编译会被缓存，直到相关的重命名或注释改变它。

分析和标注调用始终绑定到活动目标的原生 Hopper 文档，即使 GUI 焦点改变
或其他文档具有相同的显示名称。使用 `open_binary` 切换目标。
字节读取在段边界处停止，并返回 `complete: false` 的可读前缀。
文件偏移映射会检查反查和原始可执行文件的边界；合成的外部符号内存没有
原始文件偏移。对于 FAT Mach-O，偏移指的是原始容器文件。结果保留 Hopper
的镜像相对偏移、观测到的切片基址和源可执行文件路径。
加载器选择会读取 Mach-O 容器头部，包括单架构的 FAT 文件。对于 FAT64，
ChaiChai 会验证架构表和选定的 Mach-O 头部，准备一个私有瘦镜像，
并用 Hopper 的原生 Mach-O 加载器加载它。它会在复制切片时检查整个源的
SHA-256；源标识和报告的偏移仍指向原始容器。
模糊的架构子类型需要显式提取的瘦镜像；ChaiChai 不会猜测。
已配置的加载器参数仍是显式覆盖。FAT64 与 CPU 架构是不同的概念：
FAT32 容器可以包含 64 位可执行镜像。这一准备避免了在 Hopper 6.1.0-demo 上
原生加载 FAT64 时观察到的 Raw Binary 加载器对话框。
准备好的镜像及其拥有的文档会一起关闭，包括在 MCP 退出时；
如果文档关闭未得到确认，ChaiChai 会保留后备镜像并报告其路径和
`cleanup_incomplete`。普通文档保持其现有的 MCP 退出行为。
启动截止时间报告桥接就绪缺失并保留启动器的结果；辅助进程成功退出并不能证明
加载器对话框已完成。
如果拥有的提供方进程退出，请求失败会保留其观测到的退出码或信号以及
`details.launcher` 中的有限输出。进程退出可能先于输出流关闭；
`output_closed: false` 明确保留这种不确定性。
后续请求保留已知的退出信息，而不是将其归结为套接字丢失。
外部 GUI 的辅助进程退出并不能证明 GUI 本身已退出。
关于光标导航、字符串解码、符号名限制和正则匹配，
参见 [Hopper 分析行为](native-investigation.md#hopper-analysis-behavior)。

关闭或切换目标会关闭其绑定的 Hopper 文档、关闭 ChaiChai 的桥接
并删除其临时套接字目录。macOS 的 Hopper 应用和其他无关文档保持打开；
拥有的 Linux 演示应用会停止。
`cleanup_incomplete` 结果会指出清理无法验证的资源。
ChaiChai 保留未解决的清理所有权和任何已确认的关闭阶段。
处理完报告的故障后，在同一连接上重试 `close_binary`。
未确认的文档或进程清理会保留目标/应用租约，并阻止其他客户端针对该自有
资源启动。一旦文档和进程关闭得到确认，即使临时文件清理失败，
也可以释放租约。之后另一个客户端可以启动，但拥有客户端必须先完成其
保留的清理，才能再次启动。
只要其已认证的桥接保持连接，未确认的外部文档可以重试。
如果该桥接已断开，再次关闭无法确认文档：请在结束拥有者的 ChaiChai 连接之前，
在 Hopper 中检查并关闭报告的文档。

### CI 中的 Hopper

ChaiChai 的无人值守 Linux 路径针对 Hopper 提供的演示模式进行验证。
该路径不需要付费许可证，ChaiChai 也不会读取、安装或自动化许可证凭据。
有许可证的 Hopper 安装仍受支持，但许可证激活是由操作者负责的前置条件，
而不是 ChaiChai 安装的一部分。

macOS 要求在同一用户会话中完成 Hopper 的首次运行界面，该会话也将运行
ChaiChai：在开始无人值守任务之前，请选择演示模式或激活已有许可证。
因此临时性的 macOS runner 需要预先配置的用户会话，或一个有意的交互式
引导步骤。

当 Hopper 无法在 CI 中启动时，在出问题的 runner 中运行
`chaichai doctor --provider hopper --json`。
结构化失败会区分私有显示依赖、不支持的演示对话框或构建、进程所有权冲突
以及早期生命周期退出。请应用报告的修复建议，而不是暴露 runner 的桌面、
把许可证机密复制到日志中，或杀死无关的 Hopper 进程。

## Ghidra

ChaiChai 连接 Linux x64/arm64、macOS x64/arm64 或实验性 Windows x64 P0 上
已有的 Ghidra 安装。
它接受 Ghidra 12.1.x 以及该安装通过 `application.java.min` 和
`application.java.max` 声明的 64 位完整 JDK。当前的 12.1 版本要求
JDK 21 或更高版本，且未设置上限。该桥接已用 Ghidra 12.1.4 和 JDK 21
验证。每个安装必须在 `Ghidra/Features/Decompiler/os/<platform>/` 或相应的
`build/os/<platform>/` 目录中包含面向主机架构的原生反编译器。
Linux ARM64 使用 `linux_arm_64`；官方发布归档可能要求你单独构建该原生组件。
ChaiChai 通过检查文件自身的可执行头部来检查可执行前置条件，因此为其他平台
或架构构建的原生组件会被报告为不兼容，而不是凭目录名放行；
无法读取或识别的头部会被报告为未知。ChaiChai 不会构建或安装原生工具，
也不会更改 Gatekeeper 隔离设置。

适配器暴露 25 个只读操作：13 个清点/名称/搜索操作和 12 个函数分析操作。
这些操作涵盖元数据、反编译、汇编、已解析的调用、带类型的引用、交叉引用、
函数档案、指令、恢复的数据类型、测得的加载映射、已加载内存字节和观测到的
文件偏移。独立的加载镜像证明支持 DOS MZ、显式选择的 COM 和显式的
原始二进制导入；PE 返回带有不支持的证明状态的测量结果。
在 Linux 和 macOS 上，`annotate_native_function` 还会以原子方式编辑函数名
和/或入口注释并返回刷新后的分析，`set_address_name` 和 `set_addresses_names`
可为函数入口或任何其他已映射地址命名（创建或重命名其主标签），
并返回逐地址的成功结果。这些会话元数据编辑不会更改可执行字节，
并在关闭时丢弃。GUI 控制需要 Hopper；Windows P0 仍为只读。

Windows P0 接纳固定本地 NTFS 卷上的原生 x86 和 x86-64 PE 应用与 DLL。
npm 软件包捆绑了原生 Job Object 所有权、受保护的私有运行时 DACL 和
基于句柄的路径准入；无需单独安装附加组件。已验证的范围和限制参见
[Windows Ghidra P0 指南](windows-ghidra-p0.md)。

在 ChaiChai 之外解压 Ghidra 并安装 JDK，然后导出绝对路径：

```bash
export GHIDRA_INSTALL_DIR=/absolute/path/to/ghidra_12.1.4_PUBLIC
export JAVA_HOME=/absolute/path/to/jdk-21 # 如果 java/javac 已在 PATH 上则可选
chaichai doctor --json
chaichai setup
```

在 Windows 上，用 PowerShell 配置已有安装：

```powershell
$env:GHIDRA_INSTALL_DIR = "C:\tools\ghidra_12.1.4_PUBLIC"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
chaichai doctor --json
chaichai providers --json
```

`chaichai setup` 可以配置受支持的 Windows Agent，并在批准后安装捆绑的
ChaiChai skill。直接注册使用 Node 启动 ChaiChai 的入口脚本；
软件包运行器注册使用固定版本的 `npx` 或 `bunx` 命令。Windows 上仍无法安装
Hopper。安装程序从不安装 Ghidra、Java 或 Python。它会保留 Agent 注册中
检测到的有效 Ghidra/JDK 设置。提供方诊断参见
[Windows Ghidra P0](windows-ghidra-p0.md)。

Doctor 会验证平台、架构、Ghidra 12.1.x 应用版本、
`support/analyzeHeadless` 或 `support/analyzeHeadless.bat`、安装的 Java 主版本
范围、64 位 JDK 位数以及 `javac`/`javac.exe` 的存在。
当通过 `PATH` 找到 Java 时，安装程序会记录观测到的 JDK 主目录，
使 GUI MCP 客户端不依赖偶然的 shell 路径。安装程序会在其计划中显示
每个确切的环境条目，仅在批准后写入，且从不下载、安装、升级或修改
Ghidra 或 Java。

每个已验证的会话使用临时临时项目和隔离的 home/cache/config/temp 路径。
ChaiChai 传入 `-readOnly`、`-deleteProject`，使用 Ghidra 的默认分析设置，
并通过 `-scriptPath` 加载其打包的 Java 桥接；它从不会打开已有的用户项目。
Linux 和 macOS 使用仅当前用户可用的本地桥接套接字和描述符。
项目位于所选临时目录下。如果其 Unix 套接字路径名超过主机的字节限制，
ChaiChai 会在 `/tmp` 下分配一个仅拥有者可用的独立套接字目录，
并在关闭、取消或失败时将其删除。诊断信息会保留实际端点和两个自有目录。
在 Linux 和 macOS 上，ChaiChai 使用 Ghidra 自己的 LaunchSupport 配置
直接启动被检查的 JVM。Apple 平台的 shell 包装脚本会向所有权检查隐藏其环境，
因此保留这些包装脚本会阻止启动期间已验证的进程组取消。
如果所有权仍无法验证，它会报告原因并保留进程管理器和私有运行时，
而不是在活动的提供方之下删除文件。
实验性的 Windows 传输使用带私有原生拥有持有者描述符和 Job Object 进程所有权的
经认证的 IPv4 回环连接。

操作只在默认自动分析完成后才开始。`open_binary` 会选择并验证目标/提供方
绑定；它不会等待 Ghidra 导入和自动分析。第一个由 Ghidra 支持的查询会
惰性启动这项工作。提供方启动截止时间默认为 330,000 毫秒，用于导入、分析、
桥接和健康就绪。大型二进制文件可能需要更多：请在服务器环境中把
`REA_GHIDRA_STARTUP_TIMEOUT_MS` 设为 1 到 2,147,483,647 毫秒之间的整数。
未设置时使用默认值；空值、无效值或超出范围的值会导致配置验证失败。
ChaiChai 解析所给的配置环境并把截止时间传给每个提供方客户端；
启动失败由触发它的查询返回，不暴露部分分析。这个截止时间独立于 MCP 传输
初始化和客户端对该单个工具调用的截止时间。即使 Ghidra 能在其启动截止时间内
完成，客户端也可能更早超时。
客户端选项以及关闭/重开恢复流程参见
[Ghidra 首次查询截止时间与恢复](mcp-contracts.md#ghidra-first-query-deadlines-and-recovery)。

一个会话恰好包含一个导入的 Program；当 Hopper 和 Ghidra 都支持目标时，
使用 `provider_id: "ghidra"`、`--provider ghidra` 或
`REA_ANALYSIS_PROVIDER=ghidra`。
一个持久的反编译器由该 Program 拥有，一个串行队列让 Ghidra API 调用保持在
拥有该 Program 的线程上，没有固定的队列长度。
操作会一直运行直到得到结果、调用方取消或提供方关闭；
没有固定的每操作或响应大小上限。未解析的计算调用保持未知，
引用类型的来源信息被保留，提供方特有的伪代码永远不会被当作原始源代码或与
Hopper 等效的文本。

### 缺少 macOS 原生反编译器

如果 `chaichai doctor --json` 在 macOS x64 上报告 `native_decompiler` 缺失，
解压出的 Ghidra 归档可能只包含反编译器源代码而没有 macOS 可执行文件。
对于 Ghidra 12.1.4，你可以用已有的 Xcode Command Line Tools 安装、`make`
和 `bison` 手动构建它：

```bash
cd "$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/src/decompile/cpp"
make ghidra_opt
decompiler_dir="$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/os/mac_x86_64"
mkdir -p "$decompiler_dir"
test ! -e "$decompiler_dir/decompile" && test ! -L "$decompiler_dir/decompile" &&
  install -m 755 ghidra_opt "$decompiler_dir/decompile"
chaichai doctor --json
```

复制步骤要求目标位置不存在，并保留已有的反编译器。这个配方特定于 macOS x64：
[Ghidra 12.1.4 Makefile](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/Ghidra/Features/Decompiler/src/decompile/cpp/Makefile)
在 Darwin 上显式选择 `-arch x86_64`。对于 Gradle 构建，请遵循对应版本的
[原生组件说明](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/GhidraDocs/GettingStarted.md#building-native-components)。
ChaiChai 接受 `os/<platform>/` 或 `build/os/<platform>/` 下匹配的可执行文件；
它不会在安装或诊断期间构建该组件。

### macOS arm64 原生反编译器

在 Apple Silicon 上，同样的源码构建配合显式覆盖即可；不需要修改 Makefile，
也不需要 Rosetta。
[Ghidra 12.1.4 Makefile](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/Ghidra/Features/Decompiler/src/decompile/cpp/Makefile)
中的 Darwin 块固定了 `-arch x86_64`，但 `ARCH_TYPE` 和 `OSDIR` 是普通的
make 变量，命令行赋值会替换每个编译和链接规则中的值：

```bash
cd "$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/src/decompile/cpp"
make ghidra_opt ARCH_TYPE="-arch arm64" OSDIR=mac_arm_64
decompiler_dir="$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/os/mac_arm_64"
mkdir -p "$decompiler_dir"
test ! -e "$decompiler_dir/decompile" && test ! -L "$decompiler_dir/decompile" &&
  install -m 755 ghidra_opt "$decompiler_dir/decompile"
chaichai doctor --json
```

已在 macOS 15.6 arm64（Apple clang 17、自带的 bison 2.3）上用 Ghidra 12.1.4
端到端验证：构建产生 Mach-O arm64 的 `ghidra_opt`，doctor 检查
`ghidra-native_decompiler` 变为健康并显示
"reports mach-o arm64, which matches darwin/arm64"，
并且对 arm64 Mach-O 运行 `chaichai decompile` 会通过无头提供方返回反编译的 C。
make 步骤不需要 JDK，JDK 只用于 Ghidra 提供方。如果你的工具链拒绝了继承的
`-mmacosx-version-min=10.6` 标志，请用 `ADDITIONAL_FLAGS="-w"` 重试 make。

### Ghidra 导入语言和种子分析

Ghidra 从可执行文件头部检测语言。要手动设置（例如 Borland C++ PE 镜像）：

```bash
export REA_GHIDRA_LANGUAGE_ID="x86:LE:32:default"
export REA_GHIDRA_COMPILER_SPEC_ID="borlandcpp"   # 可选；需要语言设置
```

ChaiChai 传入 `-processor`/`-cspec`，对照安装的 `.ldefs` 检查两者，
并把它们记录到分析 profile 中。DOS 导入会拒绝覆盖项。

要为自动分析无法到达的代码播种（计算跳转、数据中的指针）：

```bash
export REA_GHIDRA_SEED_FILE=/absolute/path/to/seeds.tsv
```

每行格式为 `address<TAB>kind[<TAB>name]`，其中 kind 是 `function`、`code` 或
`label`（label 需要名称）。地址是默认空间中的 `0x` 十六进制；`#` 开头行是注释。
预脚本会在自动分析之前应用种子：函数从高地址到低地址，然后是 code，
最后是 label。种子摘要是分析 profile 的一部分，如果应用的种子不一致，
会话会失败。结果限制会报告结果计数；当种子与 Ghidra 已解码的指令重叠时，
该种子会失败。

Label 种子可以命名已映射的未初始化存储区，如 `.bss`；
function 和 code 种子需要已初始化的字节。

要跳过指定的 Ghidra 自动分析器（例如，当默认自动分析在 Swift/Objective-C
arm64 Mach-O 的某个分析器上卡住时）：

```bash
export REA_GHIDRA_DISABLED_ANALYZERS="Objective-C Message Analyzer"
```

该值是精确的 Ghidra 分析器名称的逗号分隔列表。预脚本会在自动分析之前禁用
每个名称，分析 profile 在 `analyzer_preset` 中记录该覆盖（例如
`ghidra-default+disabled:Objective-C Message Analyzer`），当提交的 profile
与该设置不一致时，会话无法打开。名称以字母或数字开头，且只包含字母、数字、
空格、句点、下划线和连字符；最多允许 32 个名称，每个最多 120 个字符。
名称必须标识为所选 program 注册的分析器。未知的名称或仍保持启用的选项
会在自动分析和桥接之前中止无头导入，因此不成功的覆盖不会产生声称该分析器
已被禁用的会话。对于 Windows PE 资源分析，精确的名称是
`WindowsResourceReference`。禁用分析器会跳过它本应产生的事实。

### Ghidra 堆内存与 CPU 控制

请在启动 CLI 或 MCP 服务器的环境中、打开新的 Ghidra 会话之前设置资源控制。
在 Linux 和 macOS 上，ChaiChai 按以下顺序选择第一个非空设置：
`GHIDRA_HEADLESS_MAXMEM`、`GHIDRA_MAXMEM`，然后是 `2G`。
所选值会成为 JVM 的 `-Xmx` 参数。请使用 JVM 堆大小值，如 `512M` 或 `2G`；
无效值会导致 Java 启动失败。受支持的 Ghidra 12.1.4 Windows 无头脚本
按相同的优先级使用相同的设置。

在资源受限的主机上分析小目标：

```bash
export GHIDRA_HEADLESS_MAXMEM=512M
```

在 PowerShell 中：

```powershell
$env:GHIDRA_HEADLESS_MAXMEM = "512M"
```

MCP 客户端必须把这个设置传给它的 ChaiChai 服务器进程；更改无关终端的环境
不会重新配置已有的服务器或 JVM。512 MiB 堆已用小型的原生测试件验证过，
但更大的目标可能需要更多内存。Java 堆限制并不约束 JVM 的 RSS、Node 的堆
或整个进程族的内存总用量。启动截止时间独立于这些内存设置控制等待时间。

ChaiChai 会清除从调用方继承的 `_JAVA_OPTIONS`、`JAVA_TOOL_OPTIONS`、
`JDK_JAVA_OPTIONS` 和 `GHIDRA_JAVA_OPTIONS`，并自行拥有
`GHIDRA_HEADLESS_JAVA_OPTIONS`。通过这些变量注入的自定义标志不是受支持的
配置。在 Windows 上，ChaiChai 用其自己的隔离 home/temp 设置和
`-XX:-UsePerfData` 替换 `JDK_JAVA_OPTIONS`；在 Linux 和 macOS 上，
它直接向 Java 提供隔离路径。请使用上文受支持的堆设置，而不是通过注入变量
添加第二个 `-Xmx`。

Linux/macOS 的启动设置 `-XX:ParallelGCThreads=2` 和
`-XX:CICompilerCount=2`；受支持的 Windows 无头脚本也设置这两个数值。
它们约束的是特定的 JVM 线程池，而不是所有分析线程或 CPU 用量。
ChaiChai 不传递 Ghidra 的 `-max-cpu` 选项，也不提供通用的 Ghidra CPU 限制。
需要时，请对 ChaiChai 进程应用主机 CPU 亲和性和调度控制，并验证生成的
JVM 的亲和性。请选择主机上允许的 CPU；不要假设另一台机器上的 CPU 编号
在这里有效。

请在第一个由 Ghidra 支持的查询启动 JVM 之后，在其消费方验证这些控制：
检查该自有 JVM 的生效 `-Xmx` 和 GC/编译器标志、CPU 亲和性和观测到的内存用量。
不要从父 shell 的环境或没有报错来推断它们。在 Linux 上，
`/proc/<jvm-pid>/cmdline` 包含启动参数，`/proc/<jvm-pid>/status` 报告
`Cpus_allowed_list` 和 `VmRSS`。只检查属于本会话的进程，并保留测量所需的
资源标志，而不是把完整的命令行或环境复制到报告中。堆和亲和性设置影响
成本和延迟；它们不是 ChaiChai 语义分析 profile 标识的一部分。有界的验证
工作流参见[真实提供方测试](testing.md)。

### Ghidra 诊断与验证

意外的请求失败会保留其原始内部原因。CLI 和 MCP 错误在
`details.diagnostics.failure_cause` 下暴露 Error 名称、消息和可用的代码，
包括有界的嵌套原因和明确的截断标记。Darwin 所有权辅助进程编译失败也会
保留编译结果、退出码或信号以及有界的 stderr；超时的编译器仍可与
以错误退出的编译器区分开。其他拒绝值保留其原始值或明确的类型。
关闭警告包含失败类型、消息和诊断信息，而进程和临时项目清理会继续进行。
这些消息会脱敏已知的桥接认证令牌，并保留本地路径和其他分析上下文。

在源码检出中运行 `GHIDRA_INSTALL_DIR=... npm run verify:ghidra`，
以编译并分析调试版和去符号的主机原生测试件（Linux x64/arm64 上的 ELF
或 macOS 上的 Mach-O），外加一个原生 DWARF 4 类型布局对象。
这条验证通道除 Ghidra 及其 JDK 外还需要主机 C 编译器。

运行 `GHIDRA_INSTALL_DIR=... npm run verify:ghidra:cross-format` 可增加
AArch64 ELF、x86-64 PE 和 x86-64 Mach-O 测试件覆盖。这条独立通道需要
`PATH` 上的 `clang`、LLD 和 `lld-link`；`REA_CLANG` 和 `REA_LLD_LINK`
可选择替代的命令路径。缺少跨目标工具不会阻塞主机原生的 Ghidra 验收通道。

在受控的 Windows x64 runner 上，使用 `npm run verify:ghidra:windows`。
验证器从源字节生成确定性的原生 PE 测试件，并在打开提供方之前要求
Windows 原生权限。该通道验证全部 25 个准入的只读操作、摘要标识和运行时
清理。独立的 `verify:ghidra:windows:package` 通道用普通用户检查打包的
CLI/MCP 边界。它需要构建好的 Windows 原生捆绑包和已有的 Ghidra/JDK 安装；
两者都不能仅凭启动推断出来。

## 手动 MCP 配置

对于需要手动配置的客户端，请使用：

```json
{
  "mcpServers": {
    "chaichai": {
      "command": "npx",
      "args": ["-y", "chaichai-ai@1.0.0", "mcp"]
    }
  }
}
```

持久化注册应使用一个精确的软件包版本。`chaichai setup`
写入相同的软件包运行器形式，或者当安装通过 `bunx` 运行时写入
`bunx chaichai-ai@<version> mcp`，并将其固定到执行安装时的精确版本。
运行当前的安装程序以刷新较旧的注册，然后重启客户端。

## 软件包运行器与全局安装

软件包运行器调用可以使用当前项目中安装的 ChaiChai 版本。要显式请求
最新版本，请使用：

```bash
npx chaichai-ai@latest setup
```

ChaiChai 运行 npm 所选中的版本。要更新较旧的 Agent 注册，请运行
最新版本命令并检查其安装计划。对于无人值守的软件包下载，请在软件包名之前
添加 `--yes`；这并不代表批准 ChaiChai 的安装变更。

要有意回滚，请显式指定软件包版本：

```bash
npm exec --yes --package=chaichai-ai@2.4.0 -- chaichai setup
```

安装程序会继续把持久化的 MCP 注册固定到执行安装时的精确版本。
稍后运行当前的安装程序，会通过正常的经过审查的安装事务迁移无版本号或较旧的
受管注册。

使用 Bun 时，`bunx chaichai-ai setup`（或 `bunx chaichai-ai@latest setup`）
是等效的入口。通过 `npx` 运行的安装会注册
`npx -y chaichai-ai@<version> mcp`；通过 `bunx` 或 `bun x` 运行的安装
会注册 `bunx chaichai-ai@<version> mcp`。在 Windows 上，安装程序会把任一命令
包装在 `cmd.exe /d /c` 中，以便客户端能启动运行器的命令 shim。
两种注册都不会指向运行器的临时软件包缓存。

ChaiChai 支持 Node.js 22.x（>=22.19）、24.x（>=24.11）和 26+。
不支持 Node.js 23、25 和预发布版本。它使用与该运行时配对的 npm，
且从不升级 Node.js、npm 或 Homebrew。

当 ChaiChai 在 Bun 上运行时，`chaichai doctor` 的 `node` 检查会报告
Bun 版本和 Bun 声明的 Node.js 兼容版本，当该兼容版本在受支持范围内时
检查通过。Bun 不强制执行 ChaiChai 给其自有辅助进程的 V8 堆标志，
因此在 Node.js 上报告这些限制的 Evidence 在 Bun 下会记录它们为不可用。
在 Windows 上，每个 JavaScript 辅助进程（源码分析器、source-map 解码器和
HAR 解码器）的自有 Job Object 会将其已提交内存限制为该辅助进程的堆预算
加上为 Bun 本身预留的 512 MiB，Evidence 会报告该限制。这需要匹配的捆绑
Windows 原生构件；缺少该控制构件的会拒绝启动辅助进程，而不是无限制地
运行它。CI 只测试 Node.js。

不带 `--global` 运行 `npm install chaichai-ai` 只会把可执行文件安装到
当前项目的 `node_modules/.bin` 中；它不会使 `chaichai` 在 shell 的
`PATH` 上可用。请使用上面的安装命令进行引导式安装，
用 `npx -y chaichai-ai@latest` 执行无人值守的一次性命令，
或者用 `npm install --global chaichai-ai` 全局安装，
使 `chaichai` 命令在 shell 中可见。

可选的 curl 包装脚本只安装全局 npm 软件包：

```bash
curl -fsSL https://cdn.jsdelivr.net/gh/hubooooooo/chaichai@main/install.sh | bash
```

它会在安装前打印版本、运行时、npm 命令和目标位置。当存在控制终端时，
它会启动 `chaichai setup`；否则会打印出稍后运行的命令。

用 `bash -s --` 传递选项：

```bash
curl -fsSL https://cdn.jsdelivr.net/gh/hubooooooo/chaichai@main/install.sh |
  bash -s -- --dry-run
```

支持的选项有 `--version <semver>`、`--dry-run`、`--no-setup`、
`--no-prompt` 和 `--verbose`。`--no-prompt` 或非交互 shell 都不会授予
安装外部依赖的权限。
