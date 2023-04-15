## 安装

```javascript
$ pnpm install
```

## 打包

```javascript
$ pnpm run build
```

## 发布

例如：npm 包版本 1.0.0 更新为 1.1.0

这里 `@websee/pk1` 和 `@websee/pk2` 的初始版本都为 1.0.0

### 执行 `pnpm run changeset`

1、选择要发布的包

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/27ace4eb44264250bf2eb4752aca2b10~tplv-k3u1fbpfcp-watermark.image?)

2、选择发布 minor，选择对应的包

现在是 1.0.0 更新为 1.1.0，这里选择 minor

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/947ad3a8e6c448c8949ac86b6a9f3227~tplv-k3u1fbpfcp-watermark.image?)

3、填写 changelog

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ef2b864916ec403c8612395097ea9e88~tplv-k3u1fbpfcp-watermark.image?)

4、Is this your desired changeset 选择 true

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b321231e6b094b08ac545a2257562a97~tplv-k3u1fbpfcp-watermark.image?)

### 执行 `pnpm run packages-version`

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58687e0b549e454f83b42840ed609d72~tplv-k3u1fbpfcp-watermark.image?)

提示 `All files have been updated`

打开 pk1 和 pk2 下的 package.json，发现版本号已修改完成

同时各目录下会自动生成 `CHANGELOG.md` 文件，记录版本号的变化

```js
# @websee/pk1

## 1.1.0

### Minor Changes

- 1.1.0

```

### 执行 `pnpm run publish`

发布 1.1.0 版本

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5ba1b5f4917e49de82a0d190f069ca28~tplv-k3u1fbpfcp-watermark.image?)

在 npm 官网上搜索 `@websee/pk1`，证明发布成功

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b46daf438ef343e1be9e1ab18d8e359f~tplv-k3u1fbpfcp-watermark.image?)
