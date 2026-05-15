# 需求

## Skill 生图

写一个项目级别的 Skill，具体功能如下，请你先 /sop-plan 规划出方案文档，并保存之后给我审核。

具体功能：
1. 当用户提及要生成「指定风格」下的「指定宽高比」的图片时，请你从 `styles/<指定风格>/example_cases.json` 中的 `example_cases_<snake_case格式化的指定宽高比>` 数组下提取所有的 `environment_variables` 字段值，分别替换掉 `styles/<指定风格>/prompt-template.json` 中的 `environment_variables` 占位值。
2. 然后并发使用 /image-gen 进行生图，统一使用 Replicate 通道 + GPT Image 2 模型。
3. 最后将生成的图片按对应的序号命名，并保存到 `styles/<指定风格>/preview/<snake_case格式化的指定宽高比>/` 目录下。