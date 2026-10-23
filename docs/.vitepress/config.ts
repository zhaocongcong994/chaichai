import { defineConfig } from "vitepress";

export default defineConfig({
  title: "ChaiChai 拆拆",
  description:
    "Reverse engineer binaries, applications, and runtime behavior with one CLI and MCP server.",
  lang: "en-US",
  base: "/chaichai/",
  locales: {
    root: {
      label: "English",
      lang: "en-US",
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "ChaiChai 拆拆",
      description: "用一个 CLI 和 MCP 服务器，拆开二进制、应用和运行时行为。",
      themeConfig: {
        nav: [
          { text: "安装与设置", link: "/zh/installation" },
          { text: "常见问题", link: "/zh/faq" },
        ],
        sidebar: [
          {
            text: "入门",
            items: [
              { text: "安装与设置", link: "/zh/installation" },
              { text: "常见问题", link: "/zh/faq" },
            ],
          },
          {
            text: "深入参考（英文）",
            collapsed: true,
            items: [
              { text: "客户端配置", link: "/client-configuration" },
              { text: "CLI 与证据", link: "/cli" },
              { text: "MCP 契约", link: "/mcp-contracts" },
            ],
          },
        ],
        outline: { label: "本页内容" },
        docFooter: { prev: "上一页", next: "下一页" },
        search: { provider: "local" },
        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/zhaocongcong994/chaichai",
          },
        ],
        footer: {
          message: "基于 MIT 许可证发布。",
        },
      },
    },
  },
  themeConfig: {
    nav: [
      { text: "Get started", link: "/installation" },
      { text: "Reference", link: "/mcp-contracts" },
    ],
    sidebar: [
      {
        text: "Getting started",
        items: [
          { text: "Installation and setup", link: "/installation" },
          { text: "Client configuration", link: "/client-configuration" },
          { text: "CLI and Evidence", link: "/cli" },
          { text: "Agent prompts", link: "/mcp-prompts" },
        ],
      },
      {
        text: "Investigation guides",
        items: [
          { text: "Native binaries", link: "/native-investigation" },
          { text: "Go build metadata", link: "/go-binaries" },
          {
            text: "JavaScript and Electron",
            link: "/javascript-artifact-reconstruction",
          },
          {
            text: "JavaScript workflows",
            link: "/javascript-application-workflows",
          },
          { text: "Browser observation", link: "/browser-observation" },
          {
            text: "Web network captures",
            link: "/web-network-captures",
          },
          { text: "Electron observation", link: "/electron-observation" },
          { text: "Process capture", link: "/process-capture" },
          { text: ".NET assemblies", link: "/managed-code-analysis" },
          { text: "Android applications", link: "/android-analysis" },
          { text: "Apple applications", link: "/apple-application-analysis" },
          { text: "Firmware", link: "/firmware-analysis" },
          { text: "SQLite databases", link: "/sqlite-databases" },
          { text: "Packet captures", link: "/packet-captures" },
          { text: "Signal recordings", link: "/signal-recordings" },
        ],
      },
      {
        text: "Provider guides",
        collapsed: true,
        items: [
          { text: "IDA", link: "/ida-provider" },
          { text: "Ghidra on Windows", link: "/windows-ghidra-p0" },
          { text: "Ghidra DOS analysis", link: "/ghidra-dos" },
          { text: "Ghidra raw binary", link: "/raw-binary" },
          { text: "Ghidra NativeAOT", link: "/ghidra-nativeaot" },
          { text: "Ghidra semantics", link: "/ghidra-provider" },
        ],
      },
      {
        text: "Reference and development",
        collapsed: true,
        items: [
          { text: "MCP contracts", link: "/mcp-contracts" },
          { text: "Tool design", link: "/tool-design" },
          { text: "Testing", link: "/testing" },
          { text: "Client verification", link: "/client-verification" },
          {
            text: "Reconstruction readiness",
            link: "/reconstruction-readiness",
          },
        ],
      },
    ],
    search: { provider: "local" },
    socialLinks: [
      { icon: "github", link: "https://github.com/hubooooooo/chaichai" },
    ],
    editLink: {
      pattern: "https://github.com/hubooooooo/chaichai/edit/main/docs/:path",
    },
    footer: {
      message: "Released under the MIT License.",
    },
  },
});
