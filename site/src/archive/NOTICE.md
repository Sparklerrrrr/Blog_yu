# 文章档案终端 · 第三方声明

`src/archive/engine/` 下的三维档案阵列、解密动效与正文揭示，以及 `public/archive/archive-cassette.glb`
模型，移植自 **RhineLabUI**（作者 LBEILC）：

- 仓库：https://github.com/LBEILC/RhineLabUI
- 移植时的版本：`12cc5e4013acb9408f753ff71de6b8492299b7c8`
- 在线演示：https://rhine.lubeiluchen.cc/

博客版做了这些改动：配色改为本站的冰川蓝（明 / 暗两套，见 `engine/palette.ts`）；档案数据改为本站文章
（`engine/data.ts`）；档案盒标签改画 BLOG_YU 字样（`engine/label.ts`）；模型删去了两块带
「RHINE LAB, LLC.」字样的网格并去掉无用的 UV（`scripts/prune-archive-model.py`）；不包含原项目的开场动画、
360° 拆解查看器、音频、字体与 PWA。每个移植文件开头都注明了来源与改动。

原项目说明：《明日方舟》及莱茵生命相关的名称、标志与设定不在其 MIT 授权范围内。本站使用的部分已经去掉了这些
标识；整体视觉与动效致敬原项目，与鹰角网络及原作者均无隶属关系。

---

MIT License

Copyright (c) 2026 LBEILC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
