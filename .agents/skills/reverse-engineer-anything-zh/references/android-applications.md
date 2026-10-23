# Android 应用产物

使用已连接服务器所声明的 Android 工具。仓库 main 分支和 npm
4.1.0 已包含此工具族。仅凭技能安装无法将其添加到旧版服务器上。

先对调用方提供的 APK 路径调用 `inspect_android_package`，获取包身份、
manifest 声明、覆盖范围和内联证据（Evidence）。用 `search_android_classes`
查找候选类，用 `inspect_android_class` 查看单个类的成员，
用 `inspect_android_method` 进行反编译，用
`trace_android_references` 追踪传入的静态引用。每次调用都传入各自的
APK 路径和显式选择器；不要先打开原生会话。当方法存在歧义时，从类清单中
选择 `overload_index`，不要靠猜测。

该提供方需要单独提供 headless JADX MCP JAR 0.7.1 和
Java 17 或更高版本。`REA_JADX_MCP_JAR` 用于指定 JAR 的绝对路径；
`JAVA_HOME` 可用于选择 Java。ChaiChai 的安装流程不会安装或配置该 JAR，
doctor 的提供方检查范围覆盖 Hopper/Ghidra，而不覆盖 JADX。使用现有
工具，并针对 Android 任务具体报告缺失的前置条件。

Linux 和 macOS 使用 POSIX 自有进程边界。Windows x64 需要配套的捆绑
原生控件，并使用带有双向 stdio 的自有 Job Object。每个主机都需要完整的
JDK（包括 `jdk.compiler`）；Windows 下用 `JAVA_HOME` 选择
`bin\java.exe`。实际的主机验证覆盖范围请查阅 Android 指南。调用使用
单个 worker 和提供方超时；可选的 `REA_JADX_HEAP_MIB` 用于选择 JVM
堆大小。APK 永远不会被启动，也不需要模拟器。

Manifest 条目和反编译文本是静态观察结果，不是执行或策略强制。
传入引用是恢复出的静态关系；反射、动态加载和未解析的调用仍然未知。
保留产物摘要（digest）、位置、诊断信息和不完整的覆盖范围。如需处理归档
成员而非代码分析，请使用 `open_binary` 和 `inspect_artifact`。
