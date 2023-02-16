
本着够用的原则，这个源码系列，先易后难（狗头，难的我也不会）。先不讲element build目录下工程化的配置，这些等用到的时候再说，先从组件源码，样式规范一点点铺展开来 

虽然vue3已经逐步取代了vue2，新的UI框架也款款而来，但不妨碍elementUI依然作为我心中的最佳，每每阅读总有源源不断的知识点可以学习，`经典永不过时`  

## 背景
使用了 elementUI 也有两三年了，但好像从没有认真阅读过elementUI的官方文档，只是用到的时候翻一翻，源码更没有看过。机会来了，终于睡服领导，同意打造公司的组件库（其实又是一次大型的粘贴复制）。  
领导本着凡事三板斧的原则，必要问个所以然。答案必然要备好，免得打脸。  
**1、为什么要打造自己的组件库？**  
答: 项目中，大量需要针对elementUI的样式进行二次修改，开发效率低。项目满眼的/deep/,满眼的泪  
**2、开发组件库有何收益？**   
答：通过开发组件库，实现相似产品线的整合，实现产品UI风格的统一  
**3、开发组件的人力投入如何？**  
答：分为两期，一期2人月，基本完成对原有组件的样式修改和文档补充；二期2人月，新增图形、复杂表格等组件
## 发车了
### 老规矩，Ctrl c\Ctrl v
从github上下载elementUI的源码，我的版本是**2.15.7**  
### 项目结构总览
| 目录 | 内容 |
| :--- |:--- |
| build | 工程化相关配置和脚本（越到后越感叹element的工程化程度如此之高） |
| examples | 官方文档项目（没想到elementUI官方文档也在组件库中，厉害，原谅我这碗水太浅） |
| lib | 组件库打包后生成的文件（执行npm run dist即可生成） |
| packages | 组件库源码（各组件源码都在该目录，样式文件在theme-chalk中） |
| src | 封装的公共方法和指令 |
| test | 测试脚本 |
| types | 定义组件的类型 |  

### package.json简单介绍

| 命令 | 作用 |
| --- | --- |
| dev | 启动组件库的本地开发环境，npm run dev，生成组件库的开发文档 |
| dev:play | 启动组件测试项目，npm run dev:play，用于验证开发的组件 |
| dist | 构建组件库, 生成lib文件，通过npm引入elementUI，就是使用lib中的内容 |

## 如何二次开发？
### 基本流程
1、npm i 安装项目依赖  
2、修改build/webpack.demo.js中的host路径，注释掉 // host: '0.0.0.0'   
3、在 examples/play/index.vue 中引入组件库中的任意组件  
4、执行npm run dev:play   
5、浏览器打开 http://localhost:8085 就可以进入组件测试页面

### 二次开发哪些内容？ 
1、自定义一套新的UI样式、多套主题颜色、支持一键换肤  
2、自定义组件名称，将所有以el开头的组件，改成以ld开头,如按钮组件变为ld-button  
3、新增复杂表格组件、图形组件、关系图谱组件等等
4、引入自己的图标库，图标库要支持彩色图标，同时兼容elementUI本身的图标  
5、结合公司业务，修改多个组件的交互逻辑，如级联组件、下拉框组件、tree组件等等
6、……

### 自定义主题颜色
1、打开**packages/theme-chalk/src/common/var.scss**  
该文件定义组件库统一的色板与样式。各样式分类清晰，方便各组件统一引用，为后期的换肤打好基础。  
2、修改各主题色：  
\$--color-primary、\$--color-success、\$--color-warning、\$--color-danger、\$--color-info  
3、按照新的UI修改色板中的其他颜色，尽量先不要删除色板中变量，以免造成编译失败  
4、非常好用[Mix()](https://www.cnblogs.com/qjuly/p/9125219.html)函数  
**作用：**  
Mix函数是将两种颜色根据一定的比例混合在一起，生成另一种颜色。\$color-1 和 \$color-2 指的是需要合并的颜色，\$weight 为合并的比例，默认值为 50%    
**语法如下：**  
```
mix($color-1,$color-2,$weight)
@debug mix(#f00, #00f, 25%) // #4f00bf
```
5、**elementUI为何要使用Mix函数？**  
`通过Mix函数，可以实现定义一套样式规则，实现了UI色板规则的统一`   
组件颜色有各种状态，比如hover、focus、active等  
以primary主题色为例:  
hover颜色：\$--color-primary-hover: mix(\$--color-white, \$--color-primary, 20%)  --白色与主色混入  
active颜色：\$--color-primary-active: mix(\$--color-black, \$--color-primary, 20%)  --黑色与主色混入  
这样success、warning、danger、info等主题色都可以按照这个混入规则生成对应状态的颜色**yyds**

### 自定义组件名前缀
**将所有以el开头的组件，改成以ld开头**  
以button按钮组件为例,标签名变为ld-button  
1、**打开packages/button/src/button.vue**  
将template模板中，将class所有el开头的替换成ld，注意el-icon开头的class不要替换（这是element的图标名）。export default中 name: 'ElButton' → name: 'LdButton'  
2、**打开packages/theme-chalk/src/button.scss**  
将所有以el开头的class类名替换成ld，同样el-icon开头的class不要替换  
3、**打开packages/theme-chalk/src/mixins/config.scss**  
将\$namespace: 'el' 替换成 \$namespace: 'ld'  
4、**打开examples/play/index.vue**  
引入ld-button组件
````
<ld-button type="primary">默认按钮</ld-button>
````
5、npm run dev:play，打开http://localhost:8085 页面，即可看到新生成的ld-button按钮组件  

## 到达第一站
到这里铁子们已初步了解elementUI源码架构和基本开发步骤。说不多说，开始着手打造自己的组件库吧。  
下一篇将讲解 `elementUI 源码系列二：BEM实现 Sass语法 Css编码规范` ，我们继续发车
## 参考链接  
[如何快速为团队打造自己的组件库（上）—— Element 源码架构](https://juejin.cn/post/6935977815342841892#heading-42)  
[如何快速为团队打造自己的组件库（下）—— 基于 element-ui 为团队打造自己的组件库](https://juejin.cn/post/6937449598143168549)









